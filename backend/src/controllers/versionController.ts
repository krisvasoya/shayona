import { Request, Response } from 'express';
import { supabase } from '../config/supabase';

export const getVersion = async (_req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('app_config')
      .select('value')
      .eq('key', 'version')
      .single();

    if (error || !data) {
      // Fallback response if table is empty
      return res.json({
        version: '1.0.0',
        changelog: 'Initial Release with Invoices, PDF, Baki/Jama and Multi-Language.',
        downloadUrl: '',
      });
    }

    return res.json(data.value);
  } catch (err: any) {
    return res.status(500).json({
      error: 'Failed to fetch version info',
      version: '1.0.0',
      changelog: 'Initial release',
      downloadUrl: '',
    });
  }
};
