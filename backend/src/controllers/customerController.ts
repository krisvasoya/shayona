import { Request, Response } from 'express';
import { supabase } from '../config/supabase';

let mockCustomers: Array<{
  id: number;
  user_id: string;
  name: string;
  phone: string;
  address: string;
  created_at: string;
  updated_at: string;
}> = [];

export const getCustomers = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.uid;
  if (!userId) {
    res.status(401).json({ error: 'User not authenticated' });
    return;
  }

  try {
    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      res.json(data || []);
      return;
    }

    const userCustomers = mockCustomers
      .filter((c) => c.user_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    res.json(userCustomers);
  } catch (error: any) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch customers' });
  }
};

export const createCustomer = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.uid;
  if (!userId) {
    res.status(401).json({ error: 'User not authenticated' });
    return;
  }

  const { name, phone, address } = req.body;

  if (!name || typeof name !== 'string' || !name.trim()) {
    res.status(400).json({ error: 'Customer name is required' });
    return;
  }

  try {
    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const { data, error } = await supabase
        .from('customers')
        .insert([
          {
            user_id: userId,
            name: name.trim(),
            phone: phone ? phone.trim() : null,
            address: address ? address.trim() : null,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      res.status(201).json(data);
      return;
    }

    const newCustomer = {
      id: Date.now(),
      user_id: userId,
      name: name.trim(),
      phone: phone ? phone.trim() : '',
      address: address ? address.trim() : '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    mockCustomers.push(newCustomer);
    res.status(201).json(newCustomer);
  } catch (error: any) {
    console.error('Error creating customer:', error);
    res.status(500).json({ error: error.message || 'Failed to create customer' });
  }
};

export const getCustomerDetail = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.uid;
  const customerId = req.params.id;

  if (!userId) {
    res.status(401).json({ error: 'User not authenticated' });
    return;
  }

  try {
    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      // 1. Fetch customer
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .select('*')
        .eq('id', customerId)
        .eq('user_id', userId)
        .single();

      if (customerError || !customer) {
        res.status(404).json({ error: 'Customer not found' });
        return;
      }

      // 2. Fetch customer's sale invoices
      const { data: invoices, error: invoiceError } = await supabase
        .from('invoices')
        .select('*')
        .eq('party_id', customerId)
        .eq('type', 'sale')
        .eq('user_id', userId)
        .order('invoice_date', { ascending: false });

      if (invoiceError) throw invoiceError;

      const invoiceList = invoices || [];
      const totalInvoices = invoiceList.length;
      const totalPaid = invoiceList.reduce((sum, inv) => sum + (Number(inv.paid_amount) || 0), 0);
      const totalAmount = invoiceList.reduce((sum, inv) => sum + (Number(inv.total_amount) || 0), 0);
      const totalOutstanding = Math.max(0, totalAmount - totalPaid);

      res.json({
        customer,
        summary: {
          totalInvoices,
          totalPaid: Number(totalPaid.toFixed(2)),
          totalOutstanding: Number(totalOutstanding.toFixed(2)),
        },
        invoices: invoiceList,
      });
      return;
    }

    const customer = mockCustomers.find(
      (c) => c.id === Number(customerId) && c.user_id === userId
    );
    if (!customer) {
      res.status(404).json({ error: 'Customer not found' });
      return;
    }

    res.json({
      customer,
      summary: { totalInvoices: 0, totalPaid: 0, totalOutstanding: 0 },
      invoices: [],
    });
  } catch (error: any) {
    console.error('Error fetching customer detail:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch customer detail' });
  }
};
