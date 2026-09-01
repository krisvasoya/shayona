import { Request, Response } from 'express';
import { supabase } from '../config/supabase';

export const getDashboardStats = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.uid;
  if (!userId) {
    res.status(401).json({ error: 'User not authenticated' });
    return;
  }

  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);

  const startDate = (req.query.startDate as string) || firstDayOfMonth;
  const endDate = (req.query.endDate as string) || lastDayOfMonth;

  try {
    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      // Query invoices within date range for user
      const { data: invoices, error } = await supabase
        .from('invoices')
        .select('id, invoice_number, total_amount, paid_amount, status, invoice_date')
        .eq('user_id', userId)
        .gte('invoice_date', startDate)
        .lte('invoice_date', endDate);

      if (error) throw error;

      const invoiceList = invoices || [];
      const totalInvoices = invoiceList.length;

      const totalPaidAmount = invoiceList.reduce(
        (sum, inv) => sum + (Number(inv.paid_amount) || 0),
        0
      );

      const totalAmount = invoiceList.reduce(
        (sum, inv) => sum + (Number(inv.total_amount) || 0),
        0
      );

      const totalOutstanding = Math.max(0, totalAmount - totalPaidAmount);

      res.json({
        totalInvoices,
        totalPaidAmount: Number(totalPaidAmount.toFixed(2)),
        totalOutstanding: Number(totalOutstanding.toFixed(2)),
        period: {
          start: startDate,
          end: endDate,
        },
      });
      return;
    }

    // Dev Fallback
    res.json({
      totalInvoices: 0,
      totalPaidAmount: 0.0,
      totalOutstanding: 0.0,
      period: {
        start: startDate,
        end: endDate,
      },
    });
  } catch (error: any) {
    console.error('Error in getDashboardStats:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch dashboard stats' });
  }
};
