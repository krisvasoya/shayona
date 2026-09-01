import * as Print from 'expo-print';
import { Invoice, ShopProfile } from '../types';

export const generateInvoicePDF = async (
  invoice: Invoice,
  shop?: Partial<ShopProfile>
): Promise<string> => {
  const shopName = shop?.shopName || 'Shayona Retail Store';
  const shopAddress = shop?.shopAddress || 'Main Market Road, Commercial Area';
  const shopPhone = shop?.shopPhone || '+91 98765 43210';
  const shopEmail = shop?.shopEmail || 'retailer@shayona.store';

  const partyName = invoice.party?.name || 'Valued Party';
  const partyPhone = invoice.party?.phone || '';
  const partyAddress = invoice.party?.address || '';

  const isSale = invoice.type === 'sale';
  const billTitle = isSale ? 'SALE INVOICE' : 'PURCHASE BILL';

  const subtotal = Number(invoice.subtotal || 0).toFixed(2);
  const discount = Number(invoice.discount || 0).toFixed(2);
  const totalAmount = Number(invoice.total_amount || 0).toFixed(2);
  const paidAmount = Number(invoice.paid_amount || 0).toFixed(2);
  const balanceDue = Math.max(0, Number(invoice.total_amount || 0) - Number(invoice.paid_amount || 0)).toFixed(2);

  const itemsRows = (invoice.items || [])
    .map((item, idx) => {
      const qty = Number(item.quantity || 1);
      const rate = Number(item.unit_price || 0).toFixed(2);
      const amt = (qty * Number(item.unit_price || 0)).toFixed(2);
      return `
        <tr>
          <td style="padding: 10px 8px; border-bottom: 1px solid #E2E8F0; text-align: center; color: #64748B;">${idx + 1}</td>
          <td style="padding: 10px 8px; border-bottom: 1px solid #E2E8F0; font-weight: 600; color: #0F172A;">${item.description}</td>
          <td style="padding: 10px 8px; border-bottom: 1px solid #E2E8F0; text-align: center; color: #334155;">${qty}</td>
          <td style="padding: 10px 8px; border-bottom: 1px solid #E2E8F0; text-align: right; color: #334155;">₹${rate}</td>
          <td style="padding: 10px 8px; border-bottom: 1px solid #E2E8F0; text-align: right; font-weight: 700; color: #0F172A;">₹${amt}</td>
        </tr>
      `;
    })
    .join('');

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <title>${billTitle} - ${invoice.invoice_number}</title>
      <style>
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        }
        body {
          background-color: #FFFFFF;
          color: #0F172A;
          padding: 32px;
          font-size: 13px;
          line-height: 1.5;
        }
        .header-container {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding-bottom: 20px;
          border-bottom: 2px solid #2563EB;
        }
        .shop-info h1 {
          font-size: 24px;
          font-weight: 800;
          color: #2563EB;
          margin-bottom: 4px;
        }
        .shop-info p {
          color: #64748B;
          font-size: 12px;
        }
        .bill-badge {
          text-align: right;
        }
        .bill-title {
          display: inline-block;
          background: #EFF6FF;
          color: #2563EB;
          font-size: 16px;
          font-weight: 800;
          padding: 6px 14px;
          border-radius: 6px;
          letter-spacing: 0.5px;
        }
        .invoice-meta {
          margin-top: 8px;
          font-size: 12px;
          color: #475569;
        }
        .party-section {
          margin-top: 20px;
          display: flex;
          justify-content: space-between;
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          padding: 14px 16px;
        }
        .party-box h3 {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #64748B;
          margin-bottom: 4px;
        }
        .party-box .name {
          font-size: 15px;
          font-weight: 700;
          color: #0F172A;
        }
        .party-box .contact {
          font-size: 12px;
          color: #475569;
          margin-top: 2px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 24px;
        }
        th {
          background-color: #F1F5F9;
          color: #475569;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          padding: 10px 8px;
          border-top: 1px solid #CBD5E1;
          border-bottom: 1px solid #CBD5E1;
        }
        .summary-container {
          margin-top: 20px;
          display: flex;
          justify-content: flex-end;
        }
        .summary-box {
          width: 280px;
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          padding: 12px 16px;
        }
        .summary-row {
          display: flex;
          justify-content: space-between;
          padding: 4px 0;
          font-size: 13px;
          color: #475569;
        }
        .summary-row.total {
          border-top: 2px solid #E2E8F0;
          margin-top: 6px;
          padding-top: 8px;
          font-size: 16px;
          font-weight: 800;
          color: #2563EB;
        }
        .summary-row.paid {
          color: #16A34A;
          font-weight: 600;
        }
        .summary-row.balance {
          color: #DC2626;
          font-weight: 700;
        }
        .notes-section {
          margin-top: 24px;
          padding: 12px 14px;
          border-left: 3px solid #2563EB;
          background: #F8FAFC;
          border-radius: 0 6px 6px 0;
        }
        .notes-section h4 {
          font-size: 11px;
          color: #64748B;
          text-transform: uppercase;
          margin-bottom: 2px;
        }
        .notes-section p {
          font-size: 12px;
          color: #334155;
        }
        .footer {
          margin-top: 40px;
          padding-top: 16px;
          border-top: 1px dashed #CBD5E1;
          text-align: center;
          color: #94A3B8;
          font-size: 11px;
        }
      </style>
    </head>
    <body>
      <div class="header-container">
        <div class="shop-info">
          <h1>${shopName}</h1>
          <p>${shopAddress}</p>
          <p>Phone: ${shopPhone} | Email: ${shopEmail}</p>
        </div>
        <div class="bill-badge">
          <div class="bill-title">${billTitle}</div>
          <div class="invoice-meta">
            <p><strong>Bill #:</strong> ${invoice.invoice_number}</p>
            <p><strong>Date:</strong> ${invoice.invoice_date}</p>
            ${invoice.due_date ? `<p><strong>Due:</strong> ${invoice.due_date}</p>` : ''}
          </div>
        </div>
      </div>

      <div class="party-section">
        <div class="party-box">
          <h3>Bill To / Party Details</h3>
          <div class="name">${partyName}</div>
          ${partyPhone ? `<div class="contact">Phone: ${partyPhone}</div>` : ''}
          ${partyAddress ? `<div class="contact">Address: ${partyAddress}</div>` : ''}
        </div>
        <div class="party-box" style="text-align: right;">
          <h3>Payment Status</h3>
          <div style="font-size: 14px; font-weight: 700; color: ${invoice.status === 'paid' ? '#16A34A' : '#EAB308'}; text-transform: uppercase;">
            ${invoice.status || 'Draft'}
          </div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 40px; text-align: center;">#</th>
            <th style="text-align: left;">Item Description</th>
            <th style="width: 70px; text-align: center;">Qty</th>
            <th style="width: 100px; text-align: right;">Rate</th>
            <th style="width: 110px; text-align: right;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows}
        </tbody>
      </table>

      <div class="summary-container">
        <div class="summary-box">
          <div class="summary-row">
            <span>Subtotal:</span>
            <span>₹${subtotal}</span>
          </div>
          ${Number(discount) > 0 ? `
          <div class="summary-row" style="color: #16A34A;">
            <span>Discount:</span>
            <span>- ₹${discount}</span>
          </div>` : ''}
          <div class="summary-row total">
            <span>Grand Total:</span>
            <span>₹${totalAmount}</span>
          </div>
          <div class="summary-row paid">
            <span>Paid (Jama):</span>
            <span>₹${paidAmount}</span>
          </div>
          <div class="summary-row balance">
            <span>Balance (Baki):</span>
            <span>₹${balanceDue}</span>
          </div>
        </div>
      </div>

      ${invoice.notes ? `
      <div class="notes-section">
        <h4>Notes / Terms</h4>
        <p>${invoice.notes}</p>
      </div>` : ''}

      <div class="footer">
        <p>Thank you for your business!</p>
      </div>
    </body>
    </html>
  `;

  const { uri } = await Print.printToFileAsync({
    html,
    base64: false,
  });

  return uri;
};
