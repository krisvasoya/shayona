import { Request, Response } from 'express';
import { supabase } from '../config/supabase';

// In-memory fallback if Supabase is not connected during local dev/testing
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

    // Fallback to local memory store
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

    // Fallback to local memory store
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
