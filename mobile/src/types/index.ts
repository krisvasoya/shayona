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
  total: number;
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
  created_at: string;
  updated_at?: string;
}

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  CustomerDetail: { customerId: number; name: string };
};

export type MainTabParamList = {
  Dashboard: undefined;
  Customers: undefined;
  Buyers: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
};
