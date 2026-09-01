export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
}

export interface Customer {
  id: number;
  user_id: string;
  name: string;
  phone?: string | null;
  address?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface Buyer {
  id: number;
  user_id: string;
  name: string;
  phone?: string | null;
  address?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface InvoiceItem {
  id?: number;
  invoice_id?: number;
  description: string;
  quantity: number;
  unit_price: number;
  total?: number;
}

export interface Payment {
  id: number;
  invoice_id: number;
  amount: number;
  payment_date: string;
  method: 'cash' | 'card' | 'upi' | 'bank_transfer' | 'other';
  reference?: string | null;
  created_at?: string;
}

export interface Invoice {
  id: number;
  user_id: string;
  invoice_number: string;
  type: 'sale' | 'purchase';
  party_id: number;
  invoice_date: string;
  due_date?: string | null;
  subtotal: number;
  discount: number;
  total_amount: number;
  paid_amount: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  notes?: string | null;
  items?: InvoiceItem[];
  payments?: Payment[];
  party?: {
    id: number;
    name: string;
    phone?: string | null;
    address?: string | null;
  };
  created_at: string;
  updated_at?: string;
}

export interface DashboardStats {
  totalInvoices: number;
  totalPaidAmount: number;
  totalOutstanding: number;
  period: {
    start: string;
    end: string;
  };
}

export interface ShopProfile {
  shopName: string;
  shopAddress: string;
  shopPhone: string;
  shopEmail: string;
  logoUrl?: string;
  gstin?: string;
}

export interface PartyDetailSummary {
  totalInvoices: number;
  totalPaid: number;
  totalOutstanding: number;
}

export interface CustomerDetailData {
  customer: Customer;
  summary: PartyDetailSummary;
  invoices: Invoice[];
}

export interface BuyerDetailData {
  buyer: Buyer;
  summary: PartyDetailSummary;
  invoices: Invoice[];
}

// Navigation types
export type AuthStackParamList = {
  Login: undefined;
};

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type MainTabParamList = {
  DashboardTab: undefined;
  CustomersTab: undefined;
  BuyersTab: undefined;
};

export type DashboardStackParamList = {
  Dashboard: undefined;
  InvoiceDetail: { invoiceId: number };
  CreateEditInvoice: { invoiceId?: number; defaultType?: 'sale' | 'purchase'; partyId?: number };
};

export type CustomersStackParamList = {
  CustomersList: undefined;
  CustomerDetail: { customerId: number; name?: string };
  InvoiceDetail: { invoiceId: number };
  CreateEditInvoice: { invoiceId?: number; defaultType?: 'sale' | 'purchase'; partyId?: number };
};

export type BuyersStackParamList = {
  BuyersList: undefined;
  BuyerDetail: { buyerId: number; name?: string };
  InvoiceDetail: { invoiceId: number };
  CreateEditInvoice: { invoiceId?: number; defaultType?: 'sale' | 'purchase'; partyId?: number };
};
