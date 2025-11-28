import { Expense, ReportData, Sale } from '@/types/financial.types';
import * as Print from 'expo-print';
import { shareAsync } from 'expo-sharing';

// --- CSS Styles ---
const css = `
  :root {
    --color-bg: #F4F4F4;
    --color-dark: #222222;
    --color-accent: #95B08F;
    --color-text: #333333;
    --color-white: #FFFFFF;
    --color-table-alt: #E8E8E8;
    
    --color-primary: #3E5F44;
    --color-secondary: #5E936C;
    --color-success: #93DA97;
    --color-danger: #F7374F;
    --color-charcoal: #2C2C2C;
    
    --color-sales-light: #E8FFD7;
    --color-expense-primary: #522546;
    --color-expense-secondary: #88304E;
    --color-cash-primary: #C75D2C;
    --color-cash-secondary: #D96F32;
    --color-cash-accent: #F8B259;
    --color-cash-light: #F3E9DC;
  }

  @page { margin: 0; size: A4; }
  
  body {
    margin: 0;
    padding: 0;
    background-color: var(--color-bg);
    font-family: 'Helvetica', sans-serif;
    color: var(--color-text);
    -webkit-print-color-adjust: exact;
  }

  .section { margin-bottom: 10mm; }
  .page-break { page-break-before: always; }

  /* Header */
  .header {
    position: relative;
    height: 80mm;
    width: 210mm;
  }
  
  .logo-box {
    position: absolute;
    top: 10mm;
    left: 14mm;
    width: 60mm;
    height: 20mm;
    background-color: var(--color-dark);
    color: var(--color-white);
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding-left: 4mm;
    box-sizing: border-box;
  }
  
  .logo-title { font-weight: bold; font-size: 12pt; line-height: 1.2; }
  .logo-subtitle { font-size: 8pt; font-weight: normal; }
  
  .report-title {
    position: absolute;
    top: 38mm;
    left: 14mm;
    color: var(--color-accent);
    font-size: 28pt;
    font-weight: bold;
    text-transform: uppercase;
    line-height: 1;
    max-width: 180mm;
  }
  
  .report-subtitle {
    position: absolute;
    top: 60mm;
    left: 14mm;
    color: var(--color-dark);
    font-size: 18pt;
    font-weight: bold;
  }
  
  .date-pill {
    position: absolute;
    top: 58mm;
    left: 130mm;
    width: 66mm;
    height: 14mm;
    background-color: var(--color-white);
    border-radius: 7mm;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding-left: 5mm;
    box-sizing: border-box;
  }
  
  .date-pill::before {
    content: '';
    position: absolute;
    left: -15mm;
    top: 50%;
    width: 10mm;
    height: 0.3mm;
    background-color: var(--color-accent);
    transform: translateY(-50%);
  }
  
  .date-pill::after {
    content: '';
    position: absolute;
    left: -6mm;
    top: 50%;
    width: 2mm;
    height: 2mm;
    border-top: 0.3mm solid var(--color-accent);
    border-right: 0.3mm solid var(--color-accent);
    transform: translateY(-50%) rotate(45deg);
  }
  
  .date-label { font-size: 8pt; font-weight: bold; color: var(--color-text); }
  .date-value { font-size: 10pt; color: var(--color-text); }

  /* Metrics Grid */
  .metrics-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 6mm;
    padding-left: 14mm;
    padding-right: 14mm;
    margin-bottom: 10mm;
  }
  
  .metric-card {
    background-color: var(--color-white);
    border: 0.3mm solid var(--color-accent);
    border-radius: 3mm;
    width: 85mm;
    height: 25mm;
    padding: 2mm 5mm;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
  
  .metric-label { font-size: 10pt; color: var(--color-text); margin-bottom: 2mm; }
  .metric-value { font-size: 16pt; font-weight: bold; color: var(--color-dark); }

  /* Tables */
  .table-section {
    padding-left: 14mm;
    padding-right: 14mm;
    margin-bottom: 10mm;
  }
  
  .table-title {
    color: var(--color-dark);
    font-size: 14pt;
    font-weight: bold;
    margin-bottom: 5mm;
    text-transform: uppercase;
  }
  
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 10pt;
  }
  
  th {
    background-color: var(--color-dark);
    color: var(--color-white);
    padding: 4mm;
    text-align: center;
    font-weight: bold;
    height: 12mm;
    vertical-align: middle;
  }
  
  td {
    padding: 4mm;
    text-align: center;
    border-bottom: 0.1mm solid #ccc;
    vertical-align: middle;
  }
  
  td:first-child { text-align: left; }
  td:last-child { text-align: right; font-weight: bold; }
  
  .alt-row { background-color: var(--color-table-alt); }

  /* Footer */
  .footer {
    position: fixed;
    bottom: 10mm;
    left: 14mm;
    right: 14mm;
    display: flex;
    justify-content: space-between;
    font-size: 9pt;
    color: var(--color-text);
  }
`;

// --- Helpers ---
const formatCurrency = (amount: number) => {
  return `Rs. ${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
};

const getMonthName = (monthIndex: number) => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[monthIndex];
};

// --- HTML Generators ---

const generateReportHTML = (data: ReportData) => {
  const { period, totalSales, totalExpenses, netProfit, cashSummary, rawSales, rawExpenses } = data;

  // Calculate Top Transactions
  const significantTransactions = [
    ...rawSales.map((sale) => ({
      date: sale.sale_date,
      type: 'REVENUE',
      party: sale.customer_name || 'Walk-in Customer',
      description: sale.description,
      category: sale.sale_type,
      total: sale.total_amount
    })),
    ...rawExpenses.map((expense) => ({
      date: expense.expense_date,
      type: 'EXPENSE',
      party: expense.vendor_name || 'Various Vendors',
      description: expense.description,
      category: expense.category,
      total: expense.total_amount
    }))
  ]
    .sort((a, b) => b.total - a.total)
    .slice(0, 12);

  const profitMargin = totalSales > 0 ? ((netProfit / totalSales) * 100).toFixed(1) : '0.0';

  return `
    <html>
      <head>
        <style>${css}</style>
      </head>
      <body>
        <!-- Header -->
        <div class="header section">
          <div class="logo-box">
            <div class="logo-title">EWHEELS</div>
            <div class="logo-subtitle">MANAGEMENT SYSTEM</div>
          </div>
          
          <div class="report-title">${getMonthName(period.month)} FINANCIAL REPORT</div>
          <div class="report-subtitle">${String(period.month + 1).padStart(2, '0')} ${period.year}</div>
          <div class="date-pill">
            <div class="date-label">Generated On:</div>
            <div class="date-value">${formatDate(new Date().toISOString())}</div>
          </div>
        </div>

        <!-- Executive Summary -->
        <div class="metrics-grid section">
          <div class="metric-card">
            <div class="metric-label">Total Revenue</div>
            <div class="metric-value" style="color: var(--color-success)">${formatCurrency(totalSales)}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Total Expenses</div>
            <div class="metric-value" style="color: var(--color-danger)">${formatCurrency(totalExpenses)}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Net Profit</div>
            <div class="metric-value" style="color: ${netProfit >= 0 ? 'var(--color-primary)' : 'var(--color-danger)'}">
              ${formatCurrency(netProfit)}
            </div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Profit Margin</div>
            <div class="metric-value" style="color: var(--color-dark)">${profitMargin}%</div>
          </div>
        </div>

        <!-- Revenue Analysis -->
        <div class="table-section section">
          <h3 class="table-title">REVENUE ANALYSIS BY CATEGORY</h3>
          <table>
            <thead>
              <tr>
                <th style="background-color: var(--color-success)">Category</th>
                <th style="background-color: var(--color-success)">Total Amount</th>
                <th style="background-color: var(--color-success)">Transactions</th>
                <th style="background-color: var(--color-success)">Revenue Share</th>
                <th style="background-color: var(--color-success)">Avg per Sale</th>
              </tr>
            </thead>
            <tbody>
              ${data.salesByCategory.map((item, index) => `
                <tr class="${index % 2 !== 0 ? 'alt-row' : ''}">
                  <td>${item.category}</td>
                  <td>${formatCurrency(item.amount)}</td>
                  <td>${item.count}</td>
                  <td>${totalSales > 0 ? ((item.amount / totalSales) * 100).toFixed(1) : '0.0'}%</td>
                  <td>${formatCurrency(item.count > 0 ? item.amount / item.count : 0)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <!-- Expense Analysis -->
        <div class="table-section section">
          <h3 class="table-title">EXPENSE ANALYSIS BY CATEGORY</h3>
          <table>
            <thead>
              <tr>
                <th style="background-color: var(--color-danger)">Category</th>
                <th style="background-color: var(--color-danger)">Total Amount</th>
                <th style="background-color: var(--color-danger)">Transactions</th>
                <th style="background-color: var(--color-danger)">Expense Share</th>
                <th style="background-color: var(--color-danger)">Avg per Expense</th>
              </tr>
            </thead>
            <tbody>
              ${data.expensesByCategory.map((item, index) => `
                <tr class="${index % 2 !== 0 ? 'alt-row' : ''}">
                  <td>${item.category}</td>
                  <td>${formatCurrency(item.amount)}</td>
                  <td>${item.count}</td>
                  <td>${totalExpenses > 0 ? ((item.amount / totalExpenses) * 100).toFixed(1) : '0.0'}%</td>
                  <td>${formatCurrency(item.count > 0 ? item.amount / item.count : 0)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <!-- Cash Summary -->
        <div class="table-section section">
          <h3 class="table-title">CASH MANAGEMENT SUMMARY</h3>
          <table>
            <thead>
              <tr>
                <th style="background-color: var(--color-cash-primary)">Opening Balance</th>
                <th style="background-color: var(--color-cash-primary)">Closing Balance</th>
                <th style="background-color: var(--color-cash-primary)">Net Change</th>
                <th style="background-color: var(--color-cash-primary)">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>${formatCurrency(cashSummary.openingTotal)}</td>
                <td>${formatCurrency(cashSummary.closingTotal)}</td>
                <td style="color: ${cashSummary.netChange >= 0 ? 'var(--color-success)' : 'var(--color-danger)'}">
                  ${cashSummary.netChange >= 0 ? '+' : ''}${formatCurrency(cashSummary.netChange)}
                </td>
                <td>${cashSummary.netChange >= 0 ? 'Positive Flow' : 'Negative Flow'}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="page-break"></div>

        <!-- Top Transactions -->
        <div class="table-section section">
          <h3 class="table-title">TOP TRANSACTIONS (BY VALUE)</h3>
          <table>
            <thead>
              <tr>
                <th style="background-color: var(--color-primary)">Date</th>
                <th style="background-color: var(--color-primary)">Type</th>
                <th style="background-color: var(--color-primary)">Party</th>
                <th style="background-color: var(--color-primary)">Description</th>
                <th style="background-color: var(--color-primary)">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${significantTransactions.map((item, index) => `
                <tr class="${index % 2 !== 0 ? 'alt-row' : ''}">
                  <td>${formatDate(item.date)}</td>
                  <td style="font-weight: bold; color: ${item.type === 'REVENUE' ? 'var(--color-success)' : 'var(--color-danger)'}">
                    ${item.type}
                  </td>
                  <td>${item.party}</td>
                  <td>${item.description}</td>
                  <td>${formatCurrency(item.total)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <!-- Footer -->
        <div class="footer">
          <div class="footer-left">EWheels Management System</div>
        </div>
      </body>
    </html>
  `;
};

const generateSalesHTML = (sales: Sale[], month: number, year: number) => {
  const totalSales = sales.reduce((sum, s) => sum + s.total_amount, 0);
  const totalCount = sales.length;

  return `
    <html>
      <head>
        <style>${css}</style>
      </head>
      <body>
        <!-- Header -->
        <div class="header section">
          <div class="logo-box">
            <div class="logo-title">EWHEELS</div>
            <div class="logo-subtitle">MANAGEMENT SYSTEM</div>
          </div>
          
          <div class="report-title">${getMonthName(month)} SALES REPORT</div>
          <div class="report-subtitle">${String(month + 1).padStart(2, '0')} ${year}</div>
          <div class="date-pill">
            <div class="date-label">Generated On:</div>
            <div class="date-value">${formatDate(new Date().toISOString())}</div>
          </div>
        </div>

        <!-- Summary -->
        <div class="metrics-grid section">
          <div class="metric-card">
            <div class="metric-label">Total Sales Volume</div>
            <div class="metric-value" style="color: var(--color-success)">${formatCurrency(totalSales)}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Total Transactions</div>
            <div class="metric-value" style="color: var(--color-dark)">${totalCount}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Average Sale Value</div>
            <div class="metric-value" style="color: var(--color-primary)">
              ${formatCurrency(totalCount > 0 ? totalSales / totalCount : 0)}
            </div>
          </div>
        </div>

        <!-- Sales List -->
        <div class="table-section section">
          <h3 class="table-title">DETAILED SALES LIST</h3>
          <table>
            <thead>
              <tr>
                <th style="background-color: var(--color-success)">Date</th>
                <th style="background-color: var(--color-success)">Sale No.</th>
                <th style="background-color: var(--color-success)">Customer</th>
                <th style="background-color: var(--color-success)">Type</th>
                <th style="background-color: var(--color-success)">Payment</th>
                <th style="background-color: var(--color-success)">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${sales.map((sale, index) => `
                <tr class="${index % 2 !== 0 ? 'alt-row' : ''}">
                  <td>${formatDate(sale.sale_date)}</td>
                  <td>${sale.sale_number}</td>
                  <td>${sale.customer_name || 'N/A'}</td>
                  <td>${sale.sale_type}</td>
                  <td>${sale.payment_method}</td>
                  <td>${formatCurrency(sale.total_amount)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <!-- Footer -->
        <div class="footer">
          <div class="footer-left">EWheels Management System</div>
        </div>
      </body>
    </html>
  `;
};

const generateExpensesHTML = (expenses: Expense[], month: number, year: number) => {
  const totalExpenses = expenses.reduce((sum, e) => sum + e.total_amount, 0);
  const totalCount = expenses.length;

  return `
    <html>
      <head>
        <style>${css}</style>
      </head>
      <body>
        <!-- Header -->
        <div class="header section">
          <div class="logo-box">
            <div class="logo-title">EWHEELS</div>
            <div class="logo-subtitle">MANAGEMENT SYSTEM</div>
          </div>
          
          <div class="report-title">${getMonthName(month)} EXPENSES REPORT</div>
          <div class="report-subtitle">${String(month + 1).padStart(2, '0')} ${year}</div>
          <div class="date-pill">
            <div class="date-label">Generated On:</div>
            <div class="date-value">${formatDate(new Date().toISOString())}</div>
          </div>
        </div>

        <!-- Summary -->
        <div class="metrics-grid section">
          <div class="metric-card">
            <div class="metric-label">Total Expenses</div>
            <div class="metric-value" style="color: var(--color-danger)">${formatCurrency(totalExpenses)}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Total Transactions</div>
            <div class="metric-value" style="color: var(--color-dark)">${totalCount}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Average Expense</div>
            <div class="metric-value" style="color: var(--color-expense-secondary)">
              ${formatCurrency(totalCount > 0 ? totalExpenses / totalCount : 0)}
            </div>
          </div>
        </div>

        <!-- Expenses List -->
        <div class="table-section section">
          <h3 class="table-title">DETAILED EXPENSES LIST</h3>
          <table>
            <thead>
              <tr>
                <th style="background-color: var(--color-danger)">Date</th>
                <th style="background-color: var(--color-danger)">Expense No.</th>
                <th style="background-color: var(--color-danger)">Vendor</th>
                <th style="background-color: var(--color-danger)">Category</th>
                <th style="background-color: var(--color-danger)">Status</th>
                <th style="background-color: var(--color-danger)">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${expenses.map((expense, index) => `
                <tr class="${index % 2 !== 0 ? 'alt-row' : ''}">
                  <td>${formatDate(expense.expense_date)}</td>
                  <td>${expense.expense_number}</td>
                  <td>${expense.vendor_name || 'N/A'}</td>
                  <td>${expense.category}</td>
                  <td>${expense.approval_status}</td>
                  <td>${formatCurrency(expense.total_amount)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <!-- Footer -->
        <div class="footer">
          <div class="footer-left">EWheels Management System</div>
        </div>
      </body>
    </html>
  `;
};

// --- PDF Generators ---

export const generateFinancialReportPDF = async (data: ReportData) => {
  try {
    const html = generateReportHTML(data);
    const { uri } = await Print.printToFileAsync({ html });
    await shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};

export const generateSalesPDF = async (sales: Sale[], month: number, year: number) => {
  try {
    const html = generateSalesHTML(sales, month, year);
    const { uri } = await Print.printToFileAsync({ html });
    await shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
  } catch (error) {
    console.error('Error generating Sales PDF:', error);
    throw error;
  }
};

export const generateExpensesPDF = async (expenses: Expense[], month: number, year: number) => {
  try {
    const html = generateExpensesHTML(expenses, month, year);
    const { uri } = await Print.printToFileAsync({ html });
    await shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
  } catch (error) {
    console.error('Error generating Expenses PDF:', error);
    throw error;
  }
};
