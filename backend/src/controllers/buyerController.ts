import { Request, Response } from 'express';
import { supabase } from '../config/supabase';

let mockBuyers: Array<{
  id: number;
  user_id: string;
  name: string;
  phone: string;
  address: string;
  created_at: string;
  updated_at: string;
}> = [];

export const getBuyers = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.uid;
  if (!userId) {
    res.status(401).json({ error: 'User not authenticated' });
    return;
  }

  try {
    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const { data, error } = await supabase
        .from('buyers')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      res.json(data || []);
      return;
    }

    const userBuyers = mockBuyers
      .filter((b) => b.user_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    res.json(userBuyers);
  } catch (error: any) {
    console.error('Error fetching buyers:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch buyers' });
  }
};

export const createBuyer = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.uid;
  if (!userId) {
    res.status(401).json({ error: 'User not authenticated' });
    return;
  }

  const { name, phone, address } = req.body;

  if (!name || typeof name !== 'string' || !name.trim()) {
    res.status(400).json({ error: 'Buyer name is required' });
    return;
  }

  try {
    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const { data, error } = await supabase
        .from('buyers')
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

    const newBuyer = {
      id: Date.now(),
      user_id: userId,
      name: name.trim(),
      phone: phone ? phone.trim() : '',
      address: address ? address.trim() : '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    mockBuyers.push(newBuyer);
    res.status(201).json(newBuyer);
  } catch (error: any) {
    console.error('Error creating buyer:', error);
    res.status(500).json({ error: error.message || 'Failed to create buyer' });
  }
};

export const getBuyerDetail = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.uid;
  const buyerId = req.params.id;

  if (!userId) {
    res.status(401).json({ error: 'User not authenticated' });
    return;
  }

  try {
    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      // 1. Fetch buyer
      const { data: buyer, error: buyerError } = await supabase
        .from('buyers')
        .select('*')
        .eq('id', buyerId)
        .eq('user_id', userId)
        .single();

      if (buyerError || !buyer) {
        res.status(404).json({ error: 'Buyer not found' });
        return;
      }

      // 2. Fetch buyer's purchase invoices
      const { data: invoices, error: invoiceError } = await supabase
        .from('invoices')
        .select('*')
        .eq('party_id', buyerId)
        .eq('type', 'purchase')
        .eq('user_id', userId)
        .order('invoice_date', { ascending: false });

      if (invoiceError) throw invoiceError;

      const invoiceList = invoices || [];
      const totalInvoices = invoiceList.length;
      const totalPaid = invoiceList.reduce((sum, inv) => sum + (Number(inv.paid_amount) || 0), 0);
      const totalAmount = invoiceList.reduce((sum, inv) => sum + (Number(inv.total_amount) || 0), 0);
      const totalOutstanding = Math.max(0, totalAmount - totalPaid);

      res.json({
        buyer,
        summary: {
          totalInvoices,
          totalPaid: Number(totalPaid.toFixed(2)),
          totalOutstanding: Number(totalOutstanding.toFixed(2)),
        },
        invoices: invoiceList,
      });
      return;
    }

    const buyer = mockBuyers.find((b) => b.id === Number(buyerId) && b.user_id === userId);
    if (!buyer) {
      res.status(404).json({ error: 'Buyer not found' });
      return;
    }

    res.json({
      buyer,
      summary: { totalInvoices: 0, totalPaid: 0, totalOutstanding: 0 },
      invoices: [],
    });
  } catch (error: any) {
    console.error('Error fetching buyer detail:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch buyer detail' });
  }
};
