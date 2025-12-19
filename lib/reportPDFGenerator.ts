import { DailyCash, Expense, ReportData, Sale } from '@/types/financial.types';
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
  
    width: 100%;
    border-collapse: collapse;
    font-size: 10pt;
    page-break-inside: auto;
  }
  
  thead {
    display: table-header-group;
  }
  
  tr {
    page-break-inside: avoid;
    break-inside: avoid;
    -webkit-column-break-inside: avoid;
  }
  
  td, th {
    page-break-inside: avoid;
    break-inside: avoid;
    -webkit-column-break-inside: avoid;
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
  const { period, totalSales, totalExpenses, netProfit, salesByCategory, expensesByCategory, rawSales, rawExpenses } = data;

  const profitMargin = totalSales > 0 ? ((netProfit / totalSales) * 100).toFixed(1) : '0.0';

  const headerHTML = `
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
  `;

  const footerHTML = `
    <!-- Footer -->
    <div class="footer">
      <div class="footer-left">EWheels Management System</div>
    </div>
  `;

  // --- Helper to chunk list ---
  const chunkList = <T>(list: T[], chunkSize: number) => {
    const chunks = [];
    for (let i = 0; i < list.length; i += chunkSize) {
      chunks.push(list.slice(i, i + chunkSize));
    }
    return chunks;
  };

  const salesChunks = chunkList(rawSales, 9);
  const expensesChunks = chunkList(rawExpenses, 9);

  // --- HTML Generators for Sections ---
  const renderSalesTableRows = (sales: Sale[]) => sales.map((sale, index) => `
    <tr class="${index % 2 !== 0 ? 'alt-row' : ''}">
      <td>${formatDate(sale.sale_date)}</td>
      <td>${sale.sale_number}</td>
      <td>${sale.customer_name || 'N/A'}</td>
      <td>${sale.sale_type}</td>
      <td>${sale.payment_method}</td>
      <td>${formatCurrency(sale.total_amount)}</td>
    </tr>
  `).join('');

  const renderExpensesTableRows = (expenses: Expense[]) => expenses.map((expense, index) => `
    <tr class="${index % 2 !== 0 ? 'alt-row' : ''}">
      <td>${formatDate(expense.expense_date)}</td>
      <td>${expense.expense_number}</td>
      <td>${expense.vendor_name || 'N/A'}</td>
      <td>${expense.category}</td>
      <td>${expense.approval_status}</td>
      <td>${formatCurrency(expense.total_amount)}</td>
    </tr>
  `).join('');

  const salesTableHead = `
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
  `;

  const expensesTableHead = `
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
  `;

  // --- Page 1 Content: KPIs + Revenue Analysis ---
  const page1Content = `
    ${headerHTML}

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
            <th style="background-color: var(--color-success)">Avg per Sale</th>
          </tr>
        </thead>
        <tbody>
          ${salesByCategory.map((item, index) => `
            <tr class="${index % 2 !== 0 ? 'alt-row' : ''}">
              <td>${item.category}</td>
              <td>${formatCurrency(item.amount)}</td>
              <td>${item.count}</td>
              <td>${formatCurrency(item.count > 0 ? item.amount / item.count : 0)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    
    ${footerHTML}
  `;

  // --- Page 2 Content: Expense Analysis ---
  const page2Content = `
    <div class="page-break"></div>
    <div class="table-section section" style="padding-top: 10mm;">
      <h3 class="table-title">EXPENSE ANALYSIS BY CATEGORY</h3>
      <table>
        <thead>
          <tr>
            <th style="background-color: var(--color-danger)">Category</th>
            <th style="background-color: var(--color-danger)">Total Amount</th>
            <th style="background-color: var(--color-danger)">Transactions</th>
            <th style="background-color: var(--color-danger)">Avg per Expense</th>
          </tr>
        </thead>
        <tbody>
          ${expensesByCategory.map((item, index) => `
            <tr class="${index % 2 !== 0 ? 'alt-row' : ''}">
              <td>${item.category}</td>
              <td>${formatCurrency(item.amount)}</td>
              <td>${item.count}</td>
              <td>${formatCurrency(item.count > 0 ? item.amount / item.count : 0)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    ${footerHTML}
  `;

  // --- Sales Pages ---
  const salesPages = salesChunks.map((chunk, i) => `
    <div class="page-break"></div>
    <div class="table-section section" style="padding-top: 10mm;">
      ${i === 0 ? '<h3 class="table-title">FULL SALES LIST</h3>' : ''}
      <table>
        ${salesTableHead}
        <tbody>
          ${renderSalesTableRows(chunk)}
        </tbody>
      </table>
    </div>
    ${footerHTML}
  `).join('');

  // --- Expenses Pages ---
  const expensesPages = expensesChunks.map((chunk, i) => `
    <div class="page-break"></div>
    <div class="table-section section" style="padding-top: 10mm;">
      ${i === 0 ? '<h3 class="table-title">FULL EXPENSES LIST</h3>' : ''}
      <table>
        ${expensesTableHead}
        <tbody>
          ${renderExpensesTableRows(chunk)}
        </tbody>
      </table>
    </div>
    ${footerHTML}
  `).join('');

  return `
    <html>
      <head>
        <style>${css}</style>
      </head>
      <body>
        ${page1Content}
        ${page2Content}
        ${salesPages}
        ${expensesPages}
      </body>
    </html>
  `;
};

const generateSalesHTML = (sales: Sale[], month: number, year: number) => {
  const totalSales = sales.reduce((sum, s) => sum + s.total_amount, 0);
  const totalCount = sales.length;

  const headerHTML = `
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
  `;

  const footerHTML = `
    <!-- Footer -->
    <div class="footer">
      <div class="footer-left">EWheels Management System</div>
    </div>
  `;

  const salesTableHead = `
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
  `;

  const renderSalesRow = (sale: Sale, index: number) => `
    <tr class="${index % 2 !== 0 ? 'alt-row' : ''}">
      <td>${formatDate(sale.sale_date)}</td>
      <td>${sale.sale_number}</td>
      <td>${sale.customer_name || 'N/A'}</td>
      <td>${sale.sale_type}</td>
      <td>${sale.payment_method}</td>
      <td>${formatCurrency(sale.total_amount)}</td>
    </tr>
  `;

  // Explicit Pagination Logic
  const firstPageRows = sales.slice(0, 3);
  const remainingSales = sales.slice(3);
  const subsequentPages: Sale[][] = [];

  for (let i = 0; i < remainingSales.length; i += 9) {
    subsequentPages.push(remainingSales.slice(i, i + 9));
  }

  const firstPageContent = `
    ${headerHTML}

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

    <!-- Sales List (First 3 Items) -->
    <div class="table-section section">
      <h3 class="table-title">DETAILED SALES LIST</h3>
      <table>
        ${salesTableHead}
        <tbody>
          ${firstPageRows.map((sale, index) => renderSalesRow(sale, index)).join('')}
        </tbody>
      </table>
    </div>

    ${footerHTML}
  `;

  const subsequentPagesContent = subsequentPages.map(pageSales => `
    <div class="page-break"></div>
    <div class="table-section section" style="padding-top: 10mm;">
      <table>
        ${salesTableHead}
        <tbody>
          ${pageSales.map((sale, index) => renderSalesRow(sale, index)).join('')}
        </tbody>
      </table>
    </div>
    ${footerHTML}
  `).join('');

  return `
    <html>
      <head>
        <style>${css}</style>
      </head>
      <body>
        ${firstPageContent}
        ${subsequentPagesContent}
      </body>
    </html>
  `;
};

const generateExpensesHTML = (expenses: Expense[], month: number, year: number) => {
  const totalExpenses = expenses.reduce((sum, e) => sum + e.total_amount, 0);
  const totalCount = expenses.length;

  const headerHTML = `
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
  `;

  const footerHTML = `
    <!-- Footer -->
    <div class="footer">
      <div class="footer-left">EWheels Management System</div>
    </div>
  `;

  const expensesTableHead = `
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
  `;

  const renderExpenseRow = (expense: Expense, index: number) => `
    <tr class="${index % 2 !== 0 ? 'alt-row' : ''}">
      <td>${formatDate(expense.expense_date)}</td>
      <td>${expense.expense_number}</td>
      <td>${expense.vendor_name || 'N/A'}</td>
      <td>${expense.category}</td>
      <td>${expense.approval_status}</td>
      <td>${formatCurrency(expense.total_amount)}</td>
    </tr>
  `;

  // Explicit Pagination Logic
  const firstPageRows = expenses.slice(0, 3);
  const remainingExpenses = expenses.slice(3);
  const subsequentPages: Expense[][] = [];

  for (let i = 0; i < remainingExpenses.length; i += 9) {
    subsequentPages.push(remainingExpenses.slice(i, i + 9));
  }

  const firstPageContent = `
    ${headerHTML}

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

    <!-- Expenses List (First 3 Items) -->
    <div class="table-section section">
      <h3 class="table-title">DETAILED EXPENSES LIST</h3>
      <table>
        ${expensesTableHead}
        <tbody>
          ${firstPageRows.map((expense, index) => renderExpenseRow(expense, index)).join('')}
        </tbody>
      </table>
    </div>

    ${footerHTML}
  `;

  const subsequentPagesContent = subsequentPages.map(pageExpenses => `
    <div class="page-break"></div>
    <div class="table-section section" style="padding-top: 10mm;">
      <table>
        ${expensesTableHead}
        <tbody>
          ${pageExpenses.map((expense, index) => renderExpenseRow(expense, index)).join('')}
        </tbody>
      </table>
    </div>
    ${footerHTML}
  `).join('');

  return `
    <html>
      <head>
        <style>${css}</style>
      </head>
      <body>
        ${firstPageContent}
        ${subsequentPagesContent}
      </body>
    </html>
  `;
};

// --- PDF Generators ---

// --- Daily Report Generator ---

export const generateDailyReportPDF = async (
  date: string,
  sales: Sale[],
  expenses: Expense[],
  dailyCash: DailyCash | null
) => {
  const totalSales = sales.reduce((sum, s) => sum + s.total_amount, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.total_amount, 0);
  const netChange = totalSales - totalExpenses;

  const headerHTML = `
    <!-- Header -->
    <div class="header section">
      <div class="logo-box">
        <div class="logo-title">EWHEELS</div>
        <div class="logo-subtitle">MANAGEMENT SYSTEM</div>
      </div>
      
      <div class="report-title">DAILY FINANCIAL REPORT</div>
      <div class="report-subtitle">${formatDate(date)}</div>
      <div class="date-pill">
        <div class="date-label">Generated On:</div>
        <div class="date-value">${formatDate(new Date().toISOString())}</div>
      </div>
    </div>
  `;

  const footerHTML = `
    <!-- Footer -->
    <div class="footer">
      <div class="footer-left">EWheels Management System</div>
    </div>
  `;

  const salesTableHead = `
    <thead>
      <tr>
        <th style="background-color: var(--color-success)">Sale No.</th>
        <th style="background-color: var(--color-success)">Customer</th>
        <th style="background-color: var(--color-success)">Type</th>
        <th style="background-color: var(--color-success)">Payment</th>
        <th style="background-color: var(--color-success)">Amount</th>
      </tr>
    </thead>
  `;

  const expensesTableHead = `
    <thead>
      <tr>
        <th style="background-color: var(--color-danger)">Expense No.</th>
        <th style="background-color: var(--color-danger)">Vendor</th>
        <th style="background-color: var(--color-danger)">Category</th>
        <th style="background-color: var(--color-danger)">Status</th>
        <th style="background-color: var(--color-danger)">Amount</th>
      </tr>
    </thead>
  `;

  const renderSalesRow = (sale: Sale, index: number) => `
    <tr class="${index % 2 !== 0 ? 'alt-row' : ''}">
      <td>${sale.sale_number}</td>
      <td>${sale.customer_name || 'N/A'}</td>
      <td>${sale.sale_type}</td>
      <td>${sale.payment_method}</td>
      <td>${formatCurrency(sale.total_amount)}</td>
    </tr>
  `;

  const renderExpenseRow = (expense: Expense, index: number) => `
    <tr class="${index % 2 !== 0 ? 'alt-row' : ''}">
      <td>${expense.expense_number}</td>
      <td>${expense.vendor_name || 'N/A'}</td>
      <td>${expense.category}</td>
      <td>${expense.approval_status}</td>
      <td>${formatCurrency(expense.total_amount)}</td>
    </tr>
  `;

  // Explicit Pagination Logic (9 rows per page for subsequent pages)
  // Page 1: Summary + Start of Sales
  // We'll put as many sales as fit, or fixed amount. The user liked the "3 rows then 10 rows" logic.
  // Let's stick to the user's preferred "3 rows then 9 rows" logic for consistency, or maybe a bit more on page 1 since there are no category tables.
  // Page 1 has Summary (Cards). It can fit maybe 15 rows.
  // But for "Same structure", let's use the explicit chunking.
  // Let's put Sales first.

  const salesChunks: Sale[][] = [];
  // First page sales cap. If we have summary cards, let's say we fit 8 rows.
  const firstPageSalesCap = 8;

  let remainingSales = [...sales];
  const firstPageSales = remainingSales.splice(0, firstPageSalesCap);

  while (remainingSales.length > 0) {
    salesChunks.push(remainingSales.splice(0, 9));
  }

  // Same for expenses, but they start after sales.
  // This gets complex if we want to flow naturally.
  // Simplest approach: Page 1 (Summary + Sales Start). Page 2+ (Rest of Sales). Page X (Expenses Start).
  // Or just separate lists like the main report.
  // Let's do: Page 1 (Summary + Sales List). (Page break if needed). Then Expenses List.

  // Actually, let's look at the main report logic I just built.
  // It has separate pages for lists.
  // User said "same pdf style, structure".
  // So: Page 1: Summary.
  // Page 2: Sales List.
  // Page 3: Expenses List.
  // This is clean and robust.

  // Page 1 Content
  const page1Content = `
    ${headerHTML}

    <div class="metrics-grid section">
      <div class="metric-card">
        <div class="metric-label">Opening Balance</div>
        <div class="metric-value" style="color: var(--color-dark)">${formatCurrency(dailyCash?.opening_cash || 0)}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Total Sales</div>
        <div class="metric-value" style="color: var(--color-success)">${formatCurrency(totalSales)}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Total Expenses</div>
        <div class="metric-value" style="color: var(--color-danger)">${formatCurrency(totalExpenses)}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Closing Balance</div>
        <div class="metric-value" style="color: var(--color-primary)">${formatCurrency(dailyCash?.closing_cash || 0)}</div>
      </div>
    </div>

    <!-- Daily Summary Table -->
    <div class="table-section section">
      <h3 class="table-title">DAY SUMMARY</h3>
      <table>
        <thead>
          <tr>
            <th style="background-color: var(--color-primary)">Metric</th>
            <th style="background-color: var(--color-primary)">Value</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Cash Sales</td>
            <td>${formatCurrency(sales.filter(s => s.payment_method === 'cash').reduce((sum, s) => sum + s.total_amount, 0))}</td>
          </tr>
          <tr>
            <td>UPI/Bank Sales</td>
            <td>${formatCurrency(sales.filter(s => s.payment_method !== 'cash').reduce((sum, s) => sum + s.total_amount, 0))}</td>
          </tr>
          <tr>
            <td>Cash Expenses</td>
            <td>${formatCurrency(expenses.filter(e => e.payment_method === 'cash').reduce((sum, e) => sum + e.total_amount, 0))}</td>
          </tr>
          <tr>
            <td>Net Change</td>
            <td style="color: ${netChange >= 0 ? 'var(--color-success)' : 'var(--color-danger)'}">
              ${formatCurrency(netChange)}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    ${footerHTML}
  `;

  // Sales Pages (Full List, 9 per page)
  const allSalesChunks = [];
  for (let i = 0; i < sales.length; i += 9) {
    allSalesChunks.push(sales.slice(i, i + 9));
  }

  const salesPages = allSalesChunks.map((chunk, i) => `
    <div class="page-break"></div>
    <div class="table-section section" style="padding-top: 10mm;">
      ${i === 0 ? '<h3 class="table-title">DAILY SALES LIST</h3>' : ''}
      <table>
        ${salesTableHead}
        <tbody>
          ${chunk.map((sale, idx) => renderSalesRow(sale, i * 9 + idx)).join('')}
        </tbody>
      </table>
    </div>
    ${footerHTML}
  `).join('');

  // Expenses Pages (Full List, 9 per page)
  const allExpensesChunks = [];
  for (let i = 0; i < expenses.length; i += 9) {
    allExpensesChunks.push(expenses.slice(i, i + 9));
  }

  const expensesPages = allExpensesChunks.map((chunk, i) => `
    <div class="page-break"></div>
    <div class="table-section section" style="padding-top: 10mm;">
      ${i === 0 ? '<h3 class="table-title">DAILY EXPENSES LIST</h3>' : ''}
      <table>
        ${expensesTableHead}
        <tbody>
          ${chunk.map((expense, idx) => renderExpenseRow(expense, i * 9 + idx)).join('')}
        </tbody>
      </table>
    </div>
    ${footerHTML}
  `).join('');

  const html = `
    <html>
      <head>
        <style>${css}</style>
      </head>
      <body>
        ${page1Content}
        ${salesPages}
        ${expensesPages}
      </body>
    </html>
  `;

  try {
    const { uri } = await Print.printToFileAsync({ html });
    await shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
  } catch (error) {
    console.error('Error generating Daily PDF:', error);
    throw error;
  }
};

// --- Payment Method Report Generator ---

export const generatePaymentMethodReportPDF = async (
  title: string,
  startDate: Date,
  endDate: Date,
  transactions: any[] // TransactionItem[] but avoiding circular deps if types are tricky
) => {
  const dateRangeStr = startDate.toDateString() === endDate.toDateString()
    ? formatDate(startDate.toISOString())
    : `${formatDate(startDate.toISOString())} - ${formatDate(endDate.toISOString())}`;

  // Calculate Totals
  const totalIn = transactions.filter(t =>
    t.type === 'sale' ||
    t.type === 'investment' ||
    (t.type === 'drawing' && t.drawing_type === 'deposit')
  ).reduce((sum, t) => sum + t.amount, 0);

  const totalOut = transactions.filter(t =>
    t.type === 'expense' ||
    (t.type === 'drawing' && t.drawing_type === 'withdrawal')
  ).reduce((sum, t) => sum + t.amount, 0);

  const netFlow = totalIn - totalOut;

  const headerHTML = `
    <!-- Header -->
    <div class="header section">
      <div class="logo-box">
        <div class="logo-title">EWHEELS</div>
        <div class="logo-subtitle">MANAGEMENT SYSTEM</div>
      </div>
      
      <div class="report-title">${title.toUpperCase()} REPORT</div>
      <div class="report-subtitle">${dateRangeStr}</div>
      <div class="date-pill">
        <div class="date-label">Generated On:</div>
        <div class="date-value">${formatDate(new Date().toISOString())}</div>
      </div>
    </div>
  `;

  const footerHTML = `
    <!-- Footer -->
    <div class="footer">
      <div class="footer-left">EWheels Management System</div>
    </div>
  `;

  // Page 1 Summary
  const page1Content = `
    ${headerHTML}

    <div class="metrics-grid section">
      <div class="metric-card">
        <div class="metric-label">Total Inflow</div>
        <div class="metric-value" style="color: var(--color-success)">${formatCurrency(totalIn)}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Total Outflow</div>
        <div class="metric-value" style="color: var(--color-danger)">${formatCurrency(totalOut)}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Net Flow</div>
        <div class="metric-value" style="color: ${netFlow >= 0 ? 'var(--color-primary)' : 'var(--color-danger)'}">${formatCurrency(netFlow)}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Transactions</div>
        <div class="metric-value" style="color: var(--color-dark)">${transactions.length}</div>
      </div>
    </div>
    
    ${footerHTML}
  `;

  // Transaction List Pages
  const tableHead = `
    <thead>
      <tr>
        <th style="background-color: var(--color-primary)">Date</th>
        <th style="background-color: var(--color-primary)">Description</th>
        <th style="background-color: var(--color-primary)">Type</th>
        <th style="background-color: var(--color-primary)">Amount</th>
      </tr>
    </thead>
  `;

  const renderRow = (t: any, index: number) => {
    let color = 'var(--color-dark)';
    if (t.type === 'sale' || t.type === 'investment' || (t.type === 'drawing' && t.drawing_type === 'deposit')) {
      color = 'var(--color-success)';
    } else {
      color = 'var(--color-danger)';
    }

    return `
      <tr class="${index % 2 !== 0 ? 'alt-row' : ''}">
        <td>${formatDate(t.date)}</td>
        <td>${t.description}</td>
        <td style="text-transform: capitalize">${t.type}</td>
        <td style="color: ${color}; font-weight: bold;">${formatCurrency(t.amount)}</td>
      </tr>
    `;
  };

  const chunks = [];
  // Start list on Page 2 to be clean, or Page 1 if space permits.
  // Let's do separate pages for list for consistency.
  for (let i = 0; i < transactions.length; i += 9) {
    chunks.push(transactions.slice(i, i + 9));
  }

  const listPages = chunks.map((chunk, i) => `
    <div class="page-break"></div>
    <div class="table-section section" style="padding-top: 10mm;">
      ${i === 0 ? '<h3 class="table-title">TRANSACTION HISTORY</h3>' : ''}
      <table>
        ${tableHead}
        <tbody>
          ${chunk.map((t, idx) => renderRow(t, i * 9 + idx)).join('')}
        </tbody>
      </table>
    </div>
    ${footerHTML}
  `).join('');

  const html = `
    <html>
      <head>
        <style>${css}</style>
      </head>
      <body>
        ${page1Content}
        ${listPages}
      </body>
    </html>
  `;

  try {
    const { uri } = await Print.printToFileAsync({ html });
    await shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
  } catch (error) {
    console.error('Error generating Payment Method PDF:', error);
    throw error;
  }
};

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
