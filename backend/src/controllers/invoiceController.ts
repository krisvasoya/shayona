import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { generateInvoiceNumber } from '../utils/generateNumber';

export const createInvoice = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.uid;
  if (!userId) {
    res.status(401).json({ error: 'User not authenticated' });
    return;
  }

  const {
    party_id,
    type = 'sale',
    invoice_date = new Date().toISOString().slice(0, 10),
    due_date,
    notes = '',
  } = req.body;

  if (!party_id) {
    res.status(400).json({ error: 'party_id is required' });
    return;
  }

  const invoiceNumber = generateInvoiceNumber(type === 'sale' ? 'INV' : 'PUR');

  // Increment 1: 1 default test item
  const testItem = {
    description: 'Sample Retail Item',
    quantity: 1,
    unit_price: 100.0,
    total: 100.0,
  };

  const subtotal = testItem.total;
  const discount = 0.0;
  const totalAmount = subtotal - discount;

  try {
    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      // Insert Invoice
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert([
          {
            user_id: userId,
            invoice_number: invoiceNumber,
            type,
            party_id: Number(party_id),
            invoice_date,
            due_date: due_date || null,
            subtotal,
            discount,
            total_amount: totalAmount,
            paid_amount: 0.0,
            status: 'draft',
            notes,
          },
        ])
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      // Insert Test Item
      const { error: itemError } = await supabase.from('invoice_items').insert([
        {
          invoice_id: invoice.id,
          description: testItem.description,
          quantity: testItem.quantity,
          unit_price: testItem.unit_price,
        },
      ]);

      if (itemError) console.warn('Item insertion warning:', itemError);

      res.status(201).json({
        ...invoice,
        items: [testItem],
      });
      return;
    }

    // Dev Fallback
    const mockInvoice = {
      id: Date.now(),
      user_id: userId,
      invoice_number: invoiceNumber,
      type,
      party_id,
      invoice_date,
      due_date: due_date || null,
      subtotal,
      discount,
      total_amount: totalAmount,
      paid_amount: 0.0,
      status: 'draft',
      notes,
      items: [testItem],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    res.status(201).json(mockInvoice);
  } catch (error: any) {
    console.error('Error creating invoice:', error);
    res.status(500).json({ error: error.message || 'Failed to create invoice' });
  }
};
