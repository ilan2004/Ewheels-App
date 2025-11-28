/**
 * Financial Types for EV Wheels App
 * Matches the Supabase database schema for financial management
 */

// Database Enums (from your actual schema)
export type PaymentMethod = 'cash' | 'card' | 'upi' | 'bank_transfer' | 'cheque' | 'other';
export type ExpenseCategory = 'inventory' | 'utilities' | 'salary' | 'rent' | 'maintenance' | 'marketing' | 'office_supplies' | 'transport' | 'professional_services' | 'other';
export type PaymentStatus = 'pending' | 'partial' | 'paid' | 'overdue' | 'cancelled';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';
export type SaleType = 'service' | 'parts' | 'battery' | 'consultation' | 'other';

// Sale Entity
export interface Sale {
  id: string;
  invoice_id: string;
  service_ticket_id?: string;
  customer_id: string;
  customer_name?: string;
  sale_number: string;
  sale_date: string;
  sale_type: string;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  payment_method: PaymentMethod;
  payment_status: string;
  paid_amount: number;
  description: string;
  notes?: string;
  location_id: string;
  created_by: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
}

// Expense Entity
export interface Expense {
  id: string;
  expense_number: string;
  expense_date: string;
  category: ExpenseCategory;
  amount: number;
  tax_amount: number;
  total_amount: number;
  payment_method: PaymentMethod;
  payment_reference?: string;
  vendor_name?: string;
  vendor_contact?: string;
  invoice_number?: string;
  description: string;
  purpose?: string;
  notes?: string;
  approval_status: string;
  approved_by?: string;
  approved_at?: string;
  receipt_number?: string;
  document_path?: string;
  location_id: string;
  created_by: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
}

// Form Types
export interface SaleForm {
  invoice_id: string;
  service_ticket_id?: string;
  customer_id: string;
  customer_name?: string;
  sale_number: string;
  sale_date: string;
  sale_type: string;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  payment_method: PaymentMethod;
  payment_status: string;
  paid_amount: number;
  description: string;
  notes?: string;
  location_id?: string;
}

export interface ExpenseForm {
  expense_number: string;
  expense_date: string;
  category: ExpenseCategory;
  amount: number;
  tax_amount: number;
  total_amount: number;
  payment_method: PaymentMethod;
  payment_reference?: string;
  vendor_name?: string;
  vendor_contact?: string;
  invoice_number?: string;
  description: string;
  purpose?: string;
  notes?: string;
  approval_status: string;
  approved_by?: string;
  receipt_number?: string;
  document_path?: string;
  location_id?: string;
}

// Filter Types
export interface SalesFilters {
  search?: string;
  sale_type?: SaleType;
  payment_status?: PaymentStatus;
  payment_method?: PaymentMethod;
  startDate?: string;
  endDate?: string;
  customer_id?: string;
}

export interface ExpensesFilters {
  search?: string;
  category?: ExpenseCategory;
  approval_status?: ApprovalStatus;
  payment_method?: PaymentMethod;
  startDate?: string;
  endDate?: string;
  vendor_name?: string;
  is_recurring?: boolean;
}

// KPI Types
export interface FinancialKPIs {
  today: {
    sales: number;
    expenses: number;
    profit: number;
    cash_balance: number;
  };
  this_month: {
    sales: number;
    expenses: number;
    profit: number;
    profit_margin: number;
  };
  this_year: {
    sales: number;
    expenses: number;
    profit: number;
  };
}

// Chart Data Types
export interface MonthlyTrendData {
  month: string;
  sales: number;
  expenses: number;
  profit: number;
}

export interface CategoryBreakdownData {
  category: string;
  amount: number;
  percentage: number;
  color: string;
}

export interface RecentTransaction {
  id: string;
  type: 'sale' | 'expense';
  description: string;
  amount: number;
  date: string;
  category: string;
  status?: string;
}

// Pagination
export interface PaginatedFinancialResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// API Response Types
export interface FinancialApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Summary Types
export interface SalesSummary {
  total_amount: number;
  total_count: number;
  tax_amount: number;
  discount_amount: number;
  by_sale_type: { [key in SaleType]: number };
  by_payment_method: { [key in PaymentMethod]: number };
  by_payment_status: { [key in PaymentStatus]: number };
}

export interface ExpensesSummary {
  total_amount: number;
  total_count: number;
  tax_amount: number;
  by_category: { [key in ExpenseCategory]: number };
  by_payment_method: { [key in PaymentMethod]: number };
  recurring_count: number;
}

// Export Labels for UI
export const PaymentMethodLabels: Record<PaymentMethod, string> = {
  cash: 'Cash',
  card: 'Card',
  upi: 'UPI',
  bank_transfer: 'Bank Transfer',
  cheque: 'Cheque',
  other: 'Other'
};

export const SaleTypeLabels: Record<SaleType, string> = {
  service: 'Service',
  parts: 'Parts',
  battery: 'Battery',
  consultation: 'Consultation',
  other: 'Other'
};

export const PaymentStatusLabels: Record<PaymentStatus, string> = {
  pending: 'Pending',
  partial: 'Partial',
  paid: 'Paid',
  overdue: 'Overdue',
  cancelled: 'Cancelled'
};

export const ApprovalStatusLabels: Record<ApprovalStatus, string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected'
};

export const ExpenseCategoryLabels: Record<ExpenseCategory, string> = {
  inventory: 'Inventory',
  utilities: 'Utilities',
  salary: 'Salary',
  rent: 'Rent',
  maintenance: 'Maintenance',
  marketing: 'Marketing',
  office_supplies: 'Office Supplies',
  transport: 'Transport',
  professional_services: 'Professional Services',
  other: 'Other'
};

// Report Types
export interface DailyCash {
  id: string;
  date: string;
  opening_cash: number;
  closing_cash: number;
  created_at: string;
}

export interface CategoryBreakdown {
  category: string;
  amount: number;
  count: number;
}

export interface PaymentMethodBreakdown {
  method: string;
  amount: number;
  count: number;
}

export interface ReportData {
  totalSales: number;
  totalExpenses: number;
  netProfit: number;
  salesCount: number;
  expensesCount: number;
  salesByCategory: CategoryBreakdown[];
  expensesByCategory: CategoryBreakdown[];
  salesByPaymentMethod: PaymentMethodBreakdown[];
  expensesByPaymentMethod: PaymentMethodBreakdown[];
  cashSummary: {
    openingTotal: number;
    closingTotal: number;
    netChange: number;
  };
  // Raw data for PDF export
  rawSales: Sale[];
  rawExpenses: Expense[];
  rawDailyCash: DailyCash[];
  // Metadata
  period: {
    month: number;
    year: number;
    startDate: string;
    endDate: string;
  };
}
