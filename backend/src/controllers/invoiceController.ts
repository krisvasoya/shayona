import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { generateInvoiceNumber } from '../utils/generateNumber';

export const getInvoices = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.uid;
  if (!userId) {
    res.status(401).json({ error: 'User not authenticated' });
    return;
  }

  const limit = req.query.limit ? Number(req.query.limit) : 50;

  try {
    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('user_id', userId)
        .order('invoice_date', { ascending: false })
        .limit(limit);

      if (error) throw error;
      res.json(data || []);
      return;
    }

    res.json([]);
  } catch (error: any) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch invoices' });
  }
};

export const createInvoice = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.uid;
  if (!userId) {
    res.status(401).json({ error: 'User not authenticated' });
    return;
  }

  const {
    type = 'sale',
    party_id,
    invoice_date = new Date().toISOString().slice(0, 10),
    due_date,
    discount = 0,
    notes = '',
    items = [],
  } = req.body;

  if (!party_id) {
    res.status(400).json({ error: 'party_id is required' });
    return;
  }

  if (!Array.isArray(items) || items.length === 0) {
    res.status(400).json({ error: 'At least one invoice item is required' });
    return;
  }

  // Calculate Subtotal & Totals
  const subtotal = items.reduce(
    (sum: number, item: any) => sum + (Number(item.quantity) || 0) * (Number(item.unit_price) || 0),
    0
  );
  const discountVal = Number(discount) || 0;
  const totalAmount = Math.max(0, subtotal - discountVal);

  const invoiceNumber = generateInvoiceNumber(type === 'sale' ? 'INV' : 'PUR');

  try {
    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      // 1. Insert Invoice Header
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
            subtotal: Number(subtotal.toFixed(2)),
            discount: Number(discountVal.toFixed(2)),
            total_amount: Number(totalAmount.toFixed(2)),
            paid_amount: 0.0,
            status: 'draft',
            notes: notes || '',
          },
        ])
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      // 2. Insert Invoice Items
      const formattedItems = items.map((item: any) => ({
        invoice_id: invoice.id,
        description: item.description || 'Item',
        quantity: Number(item.quantity) || 1,
        unit_price: Number(item.unit_price) || 0,
      }));

      const { data: insertedItems, error: itemsError } = await supabase
        .from('invoice_items')
        .insert(formattedItems)
        .select();

      if (itemsError) throw itemsError;

      res.status(201).json({
        ...invoice,
        items: insertedItems || formattedItems,
        payments: [],
      });
      return;
    }

    // Dev Fallback
    const mockCreated = {
      id: Date.now(),
      user_id: userId,
      invoice_number: invoiceNumber,
      type,
      party_id,
      invoice_date,
      due_date,
      subtotal,
      discount: discountVal,
      total_amount: totalAmount,
      paid_amount: 0,
      status: 'draft',
      notes,
      items,
      payments: [],
      created_at: new Date().toISOString(),
    };
    res.status(201).json(mockCreated);
  } catch (error: any) {
    console.error('Error creating invoice:', error);
    res.status(500).json({ error: error.message || 'Failed to create invoice' });
  }
};

export const getInvoiceById = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.uid;
  const invoiceId = req.params.id;

  if (!userId) {
    res.status(401).json({ error: 'User not authenticated' });
    return;
  }

  try {
    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      // 1. Fetch Invoice
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', invoiceId)
        .eq('user_id', userId)
        .single();

      if (invoiceError || !invoice) {
        res.status(404).json({ error: 'Invoice not found' });
        return;
      }

      // 2. Fetch Items
      const { data: items, error: itemsError } = await supabase
        .from('invoice_items')
        .select('*')
        .eq('invoice_id', invoiceId);

      if (itemsError) throw itemsError;

      // 3. Fetch Payments
      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .eq('invoice_id', invoiceId)
        .order('payment_date', { ascending: false });

      if (paymentsError) throw paymentsError;

      // 4. Fetch Party Info
      let party: any = null;
      if (invoice.type === 'sale') {
        const { data: cust } = await supabase
          .from('customers')
          .select('id, name, phone, address')
          .eq('id', invoice.party_id)
          .single();
        party = cust;
      } else {
        const { data: buy } = await supabase
          .from('buyers')
          .select('id, name, phone, address')
          .eq('id', invoice.party_id)
          .single();
        party = buy;
      }

      res.json({
        ...invoice,
        party,
        items: items || [],
        payments: payments || [],
      });
      return;
    }

    res.status(404).json({ error: 'Invoice not found in dev mode' });
  } catch (error: any) {
    console.error('Error fetching invoice by id:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch invoice' });
  }
};

export const updateInvoice = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.uid;
  const invoiceId = req.params.id;

  if (!userId) {
    res.status(401).json({ error: 'User not authenticated' });
    return;
  }

  const {
    type,
    party_id,
    invoice_date,
    due_date,
    discount = 0,
    notes = '',
    items = [],
  } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    res.status(400).json({ error: 'At least one invoice item is required' });
    return;
  }

  // Calculate Subtotal & Totals
  const subtotal = items.reduce(
    (sum: number, item: any) => sum + (Number(item.quantity) || 0) * (Number(item.unit_price) || 0),
    0
  );
  const discountVal = Number(discount) || 0;
  const totalAmount = Math.max(0, subtotal - discountVal);

  try {
    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      // 1. Verify invoice belongs to user
      const { data: existing, error: fetchErr } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', invoiceId)
        .eq('user_id', userId)
        .single();

      if (fetchErr || !existing) {
        res.status(404).json({ error: 'Invoice not found' });
        return;
      }

      // 2. Delete existing items
      await supabase.from('invoice_items').delete().eq('invoice_id', invoiceId);

      // 3. Insert updated items
      const formattedItems = items.map((item: any) => ({
        invoice_id: Number(invoiceId),
        description: item.description || 'Item',
        quantity: Number(item.quantity) || 1,
        unit_price: Number(item.unit_price) || 0,
      }));

      const { data: insertedItems, error: itemsError } = await supabase
        .from('invoice_items')
        .insert(formattedItems)
        .select();

      if (itemsError) throw itemsError;

      // 4. Update Invoice Header (preserves paid_amount)
      const { data: updated, error: updateErr } = await supabase
        .from('invoices')
        .update({
          type: type || existing.type,
          party_id: party_id ? Number(party_id) : existing.party_id,
          invoice_date: invoice_date || existing.invoice_date,
          due_date: due_date !== undefined ? due_date : existing.due_date,
          subtotal: Number(subtotal.toFixed(2)),
          discount: Number(discountVal.toFixed(2)),
          total_amount: Number(totalAmount.toFixed(2)),
          notes: notes !== undefined ? notes : existing.notes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', invoiceId)
        .select()
        .single();

      if (updateErr) throw updateErr;

      res.json({
        ...updated,
        items: insertedItems || formattedItems,
      });
      return;
    }

    res.json({
      id: Number(invoiceId),
      subtotal,
      discount: discountVal,
      total_amount: totalAmount,
      items,
    });
  } catch (error: any) {
    console.error('Error updating invoice:', error);
    res.status(500).json({ error: error.message || 'Failed to update invoice' });
  }
};

export const recordPayment = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.uid;
  const invoiceId = req.params.id;

  if (!userId) {
    res.status(401).json({ error: 'User not authenticated' });
    return;
  }

  const {
    amount,
    method = 'cash',
    reference = '',
    payment_date = new Date().toISOString().slice(0, 10),
  } = req.body;

  const paymentAmount = Number(amount);
  if (isNaN(paymentAmount) || paymentAmount <= 0) {
    res.status(400).json({ error: 'Valid payment amount is required' });
    return;
  }

  try {
    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      // 1. Fetch current invoice
      const { data: invoice, error: invoiceErr } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', invoiceId)
        .eq('user_id', userId)
        .single();

      if (invoiceErr || !invoice) {
        res.status(404).json({ error: 'Invoice not found' });
        return;
      }

      // 2. Insert Payment Record
      const { data: payment, error: paymentErr } = await supabase
        .from('payments')
        .insert([
          {
            invoice_id: Number(invoiceId),
            amount: paymentAmount,
            method,
            reference,
            payment_date,
          },
        ])
        .select()
        .single();

      if (paymentErr) throw paymentErr;

      // 3. Update Invoice paid_amount and status
      const newPaidAmount = Number((Number(invoice.paid_amount || 0) + paymentAmount).toFixed(2));
      const newStatus = newPaidAmount >= Number(invoice.total_amount) ? 'paid' : 'sent';

      const { data: updatedInvoice, error: updateErr } = await supabase
        .from('invoices')
        .update({
          paid_amount: newPaidAmount,
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', invoiceId)
        .select()
        .single();

      if (updateErr) throw updateErr;

      res.status(201).json({
        payment,
        invoice: updatedInvoice,
      });
      return;
    }

    res.status(201).json({
      payment: { id: Date.now(), amount: paymentAmount, method, reference, payment_date },
      invoice: { id: invoiceId, paid_amount: paymentAmount },
    });
  } catch (error: any) {
    console.error('Error recording payment:', error);
    res.status(500).json({ error: error.message || 'Failed to record payment' });
  }
};
