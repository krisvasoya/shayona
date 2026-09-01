/**
 * Generates clean, unique invoice numbers without GST or complex codes.
 * Format: INV-YYYYMMDD-XXXX (e.g. INV-20260901-4921)
 */
export const generateInvoiceNumber = (prefix: string = 'INV'): string => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${dateStr}-${randomSuffix}`;
};
