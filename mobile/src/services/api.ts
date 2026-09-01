import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config/env';
import {
  DashboardStats,
  CustomerDetailData,
  BuyerDetailData,
  Invoice,
  ShopProfile,
  Payment,
} from '../types';

export const api = axios.create({
  baseURL: API_URL,
  timeout: 12000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (_) {}
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      try {
        await AsyncStorage.removeItem('userToken');
        await AsyncStorage.removeItem('userData');
      } catch (_) {}
    }
    return Promise.reject(error);
  }
);

// ----------------------------------------------------------------------
// Typed API Methods
// ----------------------------------------------------------------------

export const getDashboardStats = (startDate?: string, endDate?: string) =>
  api.get<DashboardStats>('/dashboard/stats', {
    params: { startDate, endDate },
  });

export const getCustomerDetail = (id: number | string) =>
  api.get<CustomerDetailData>(`/customers/${id}/detail`);

export const getBuyerDetail = (id: number | string) =>
  api.get<BuyerDetailData>(`/buyers/${id}/detail`);

export const getInvoices = (limit?: number) =>
  api.get<Invoice[]>('/invoices', { params: { limit } });

export const getInvoice = (id: number | string) =>
  api.get<Invoice>(`/invoices/${id}`);

export const createInvoice = (data: any) =>
  api.post<Invoice>('/invoices', data);

export const updateInvoice = (id: number | string, data: any) =>
  api.put<Invoice>(`/invoices/${id}`, data);

export const recordPayment = (id: number | string, paymentData: any) =>
  api.post<{ payment: Payment; invoice: Invoice }>(`/invoices/${id}/payments`, paymentData);

export const getShopProfile = () =>
  api.get<ShopProfile>('/shop/profile');

export default api;
