import { Request, Response } from 'express';

export const getShopProfile = async (req: Request, res: Response): Promise<void> => {
  const user = req.user;
  const displayName = user?.name || 'Shayona Retail Store';

  res.json({
    shopName: displayName,
    shopAddress: 'Main Market Road, Commercial Area',
    shopPhone: '+91 98765 43210',
    shopEmail: user?.email || 'retailer@shayona.store',
    logoUrl: '',
    gstin: '', // Intentionally empty - STRICT NO GST
  });
};
