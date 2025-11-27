import { InvoiceCustomer, InvoiceItem, InvoiceTotals } from '@/types/invoice';
import * as Print from 'expo-print';
import { shareAsync } from 'expo-sharing';
import { formatCurrency } from './invoiceCalculations';

interface GeneratePDFProps {
    invoiceNumber: string;
    date: Date;
    dueDate: Date;
    customer: InvoiceCustomer;
    items: InvoiceItem[];
    totals: InvoiceTotals;
    notes?: string;
    terms?: string;
}

export async function generateAndShareInvoicePDF(data: GeneratePDFProps) {
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        
        body {
          font-family: 'Inter', sans-serif;
          color: #374151;
          margin: 0;
          padding: 0;
          -webkit-print-color-adjust: exact;
        }
        .page {
          padding: 40px;
          max-width: 210mm;
          margin: 0 auto;
          position: relative;
        }
        /* Sidebar Decoration */
        .sidebar {
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 12mm;
          background-color: #2F6B56; /* Dark Green Theme */
          height: 100%;
        }
        .content {
          margin-left: 20mm; /* Sidebar + spacing */
        }
        .header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 40px;
        }
        .company-info h1 {
          color: #111827;
          font-size: 24px;
          margin: 0 0 5px 0;
        }
        .company-info p {
          color: #2F6B56;
          font-size: 14px;
          margin: 0;
        }
        .invoice-details {
          text-align: right;
        }
        .invoice-title {
          font-size: 32px;
          font-weight: bold;
          color: #111827;
          margin: 0;
        }
        .invoice-number {
          color: #2F6B56;
          font-size: 18px;
          font-weight: 600;
          margin: 5px 0 15px 0;
        }
        .meta-table {
          margin-left: auto;
          font-size: 12px;
        }
        .meta-table td {
          padding-bottom: 4px;
        }
        .meta-label {
          font-weight: 600;
          padding-right: 15px;
          color: #374151;
        }
        .divider {
          height: 1px;
          background-color: #9CA3AF;
          margin: 20px 0;
        }
        .addresses {
          display: flex;
          gap: 40px;
          margin-bottom: 40px;
        }
        .addr-block {
          flex: 1;
        }
        .addr-title {
          font-size: 10px;
          font-weight: bold;
          text-transform: uppercase;
          color: #6B7280;
          margin-bottom: 8px;
        }
        .addr-name {
          font-size: 16px;
          font-weight: bold;
          color: #111827;
          margin-bottom: 4px;
        }
        .addr-text {
          font-size: 12px;
          line-height: 1.5;
          color: #4B5563;
          white-space: pre-line;
        }
        /* Items Table */
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
        }
        .items-table th {
          background-color: #2F6B56;
          color: white;
          font-size: 12px;
          font-weight: 600;
          text-align: left;
          padding: 10px 15px;
        }
        .items-table th.right { text-align: right; }
        .items-table th.center { text-align: center; }
        .items-table td {
          padding: 12px 15px;
          font-size: 12px;
          border-bottom: 1px solid #E5E7EB;
        }
        .items-table td.right { text-align: right; }
        .items-table td.center { text-align: center; }
        .items-table tr:nth-child(even) {
          background-color: #F9FAFB;
        }
        /* Totals */
        .totals-section {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 40px;
        }
        .totals-box {
          width: 300px;
          background-color: #F9FAFB;
          padding: 20px;
          border-radius: 8px;
        }
        .total-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          font-size: 12px;
        }
        .total-row.final {
          margin-top: 15px;
          padding-top: 15px;
          border-top: 1px solid #D1D5DB;
          font-size: 16px;
          font-weight: bold;
          color: #111827;
        }
        .notes-section {
          margin-bottom: 30px;
          padding: 15px;
          background-color: #EFF6FF;
          border-radius: 8px;
          font-size: 12px;
        }
        .footer {
          margin-top: 50px;
          text-align: center;
          font-size: 10px;
          color: #6B7280;
          border-top: 1px solid #E5E7EB;
          padding-top: 20px;
        }
      </style>
    </head>
    <body>
      <div class="sidebar"></div>
      <div class="page">
        <div class="content">
          <!-- Header -->
          <div class="header">
            <div class="company-info">
              <h1>EWheels</h1>
              <p>Electric Vehicle Service & Solutions</p>
            </div>
            <div class="invoice-details">
              <div class="invoice-title">INVOICE</div>
              <div class="invoice-number">#${data.invoiceNumber}</div>
              <table class="meta-table">
                <tr>
                  <td class="meta-label">Date:</td>
                  <td>${data.date.toLocaleDateString('en-GB')}</td>
                </tr>
                <tr>
                  <td class="meta-label">Due Date:</td>
                  <td>${data.dueDate.toLocaleDateString('en-GB')}</td>
                </tr>
              </table>
            </div>
          </div>
          <div class="divider"></div>
          <!-- Addresses -->
          <div class="addresses">
            <div class="addr-block">
              <div class="addr-title">Company</div>
              <div class="addr-name">EWheels</div>
              <div class="addr-text">
                1/657, NH-66, Behind Mozart Furniture
                Chenakkal, Randathani
                Pin: 676510, Malappuram
                Kerala, India
                Phone: +91 98765 43210
                Email: info@ewheels.com
              </div>
            </div>
            <div class="addr-block">
              <div class="addr-title">Bill To</div>
              <div class="addr-name">${data.customer.name}</div>
              <div class="addr-text">
                ${data.customer.address || ''}
                ${data.customer.phone ? `\nPhone: ${data.customer.phone}` : ''}
                ${data.customer.email ? `\nEmail: ${data.customer.email}` : ''}
                ${data.customer.gstNumber ? `\nGST: ${data.customer.gstNumber}` : ''}
              </div>
            </div>
          </div>
          <!-- Items -->
          <table class="items-table">
            <thead>
              <tr>
                <th>Description</th>
                <th class="center">Qty</th>
                <th class="right">Price</th>
                <th class="center">SGST%</th>
                <th class="center">CGST%</th>
                <th class="right">Total</th>
              </tr>
            </thead>
            <tbody>
              ${data.items.map(item => `
                <tr>
                  <td>${item.description}</td>
                  <td class="center">${item.quantity}</td>
                  <td class="right">${formatCurrency(item.unit_price)}</td>
                  <td class="center">${item.sgst_rate}%</td>
                  <td class="center">${item.cgst_rate}%</td>
                  <td class="right">${formatCurrency(item.total)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <!-- Totals -->
          <div class="totals-section">
            <div class="totals-box">
              <div class="total-row">
                <span>Subtotal</span>
                <span>${formatCurrency(data.totals.subtotal)}</span>
              </div>
              ${data.totals.discount_total > 0 ? `
                <div class="total-row" style="color: #059669;">
                  <span>Discount</span>
                  <span>-${formatCurrency(data.totals.discount_total)}</span>
                </div>
              ` : ''}
              <div class="total-row">
                <span>SGST</span>
                <span>${formatCurrency(data.totals.sgst_total)}</span>
              </div>
              <div class="total-row">
                <span>CGST</span>
                <span>${formatCurrency(data.totals.cgst_total)}</span>
              </div>
              ${data.totals.shipping_amount > 0 ? `
                <div class="total-row">
                  <span>Shipping</span>
                  <span>${formatCurrency(data.totals.shipping_amount)}</span>
                </div>
              ` : ''}
              ${data.totals.adjustment_amount !== 0 ? `
                <div class="total-row">
                  <span>Adjustment</span>
                  <span>${formatCurrency(data.totals.adjustment_amount)}</span>
                </div>
              ` : ''}
              <div class="total-row final">
                <span>Total</span>
                <span>${formatCurrency(data.totals.grand_total)}</span>
              </div>
            </div>
          </div>
          <!-- Notes -->
          ${data.notes ? `
            <div class="notes-section">
              <strong>Notes:</strong><br/>
              ${data.notes}
            </div>
          ` : ''}
          <!-- Footer -->
          <div class="footer">
            <p>Thank you for choosing EWheels!</p>
            ${data.terms ? `<p>${data.terms}</p>` : ''}
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

    const { uri } = await Print.printToFileAsync({
        html,
        base64: false
    });

    await shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
}
