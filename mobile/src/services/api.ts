import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  DashboardStats,
  CustomerDetailData,
  BuyerDetailData,
  Invoice,
  ShopProfile,
  Payment,
} from '../types';

const baseURL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export const api = axios.create({
  baseURL,
  timeout: 10000,
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
    } catch (error) {
      console.warn('Error reading userToken from AsyncStorage', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      console.warn('Unauthorized 401 received. Clearing token.');
      try {
        await AsyncStorage.removeItem('userToken');
        await AsyncStorage.removeItem('userData');
      } catch (storageErr) {
        console.warn('Error clearing AsyncStorage on 401', storageErr);
      }
    }
    return Promise.reject(error);
  }
);

// ----------------------------------------------------------------------
// Dedicated API Helper Functions
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
