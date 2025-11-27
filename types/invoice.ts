export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'void';

export interface InvoiceCustomer {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  gstNumber?: string;
  id?: string; // Linked customer ID
}

export interface InvoiceTotals {
  subtotal: number;
  discount_total: number;
  sgst_total: number;
  cgst_total: number;
  shipping_amount: number;
  adjustment_amount: number;
  grand_total: number;
}

export interface Invoice {
  id: string;
  number: string;
  status: InvoiceStatus;
  customer: InvoiceCustomer;
  totals: InvoiceTotals;
  currency: string;
  balance_due: number;
  due_date: string;
  notes?: string;
  terms?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  source_quote_id?: string;
  location_id: string;
  items?: InvoiceItem[];
}

export interface InvoiceItem {
  id?: string;
  description: string;
  quantity: number;
  unit_price: number;
  discount: number; // Percentage
  sgst_rate: number; // Percentage
  cgst_rate: number; // Percentage

  // Calculated fields
  subtotal: number;
  discount_amount: number;
  sgst_amount: number;
  cgst_amount: number;
  total: number;
  // Inventory links
  inventory_item_id?: string;
  inventory_item_sku?: string;
  inventory_item_name?: string;
  inventory_item_type?: 'product' | 'service';
  inventory_item_category?: string;
}

export interface CreateInvoiceRequest {
  customer: InvoiceCustomer;
  items: InvoiceItem[];
  due_date: string;
  notes?: string;
  terms?: string;
  shipping_amount?: number;
  adjustment_amount?: number;
  currency: string;
  location_id?: string;
}

export interface CreateInvoiceResponse {
  success: boolean;
  data?: Invoice;
  error?: string;
}

export interface InvoiceFilters {
  status?: InvoiceStatus;
  customer_name?: string;
  date_from?: string;
  date_to?: string;
  location_id?: string;
}

export interface InvoiceListResponse {
  invoices: Invoice[];
  total: number;
  page: number;
  limit: number;
}

// For the invoice creation form
export interface InvoiceFormData {
  customer: InvoiceCustomer;
  items: InvoiceItem[];
  due_date: Date;
  notes?: string;
  terms?: string;
  currency: string;
}

export interface InvoiceCalculations {
  subtotal: number;
  totalDiscount: number;
  totalTax: number;
  total: number;
}

// Payment related types
export type PaymentMethod = 'cash' | 'card' | 'bank_transfer' | 'upi' | 'cheque';

export interface InvoicePayment {
  id: string;
  invoice_id: string;
  amount: number;
  method: PaymentMethod;
  received_at: string;
  reference?: string;
  notes?: string;
  created_at: string;
  created_by: string;
  location_id?: string;
}

export interface CreatePaymentRequest {
  invoice_id: string;
  amount: number;
  method: PaymentMethod;
  received_at: string;
  reference?: string;
  notes?: string;
  location_id?: string;
}

export interface InvoiceWithPayments extends Invoice {
  payments?: InvoicePayment[];
  total_payments: number;
}

// Status color mapping
export const InvoiceStatusColors = {
  draft: '#6B7280',
  sent: '#3B82F6',
  paid: '#10B981',
  void: '#EF4444',
} as const;

// Payment method display names
export const PaymentMethodNames = {
  cash: 'Cash',
  card: 'Card',
  bank_transfer: 'Bank Transfer',
  upi: 'UPI',
  cheque: 'Cheque',
} as const;
