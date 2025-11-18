import { InvoiceItem, InvoiceCalculations } from '@/types/invoice';

/**
 * Calculate line item totals
 */
export function calculateLineItem(
  quantity: number,
  unitPrice: number,
  discount: number = 0,
  taxRate: number = 0
): Omit<InvoiceItem, 'id' | 'invoice_id' | 'line_id' | 'description'> {
  const subtotal = quantity * unitPrice;
  const discountAmount = (subtotal * discount) / 100;
  const taxableAmount = subtotal - discountAmount;
  const taxAmount = (taxableAmount * taxRate) / 100;
  const total = taxableAmount + taxAmount;

  return {
    quantity,
    unit_price: unitPrice,
    discount,
    tax_rate: taxRate,
    subtotal,
    discount_amount: discountAmount,
    tax_amount: taxAmount,
    total,
  };
}

/**
 * Calculate invoice totals from line items
 */
export function calculateInvoiceTotals(items: InvoiceItem[]): InvoiceCalculations {
  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const totalDiscount = items.reduce((sum, item) => sum + item.discount_amount, 0);
  const totalTax = items.reduce((sum, item) => sum + item.tax_amount, 0);
  const total = items.reduce((sum, item) => sum + item.total, 0);

  return {
    subtotal,
    totalDiscount,
    totalTax,
    total,
  };
}

/**
 * Generate a unique line ID for invoice items
 */
export function generateLineId(): string {
  return `line_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Format currency amount
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

/**
 * Format percentage
 */
export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

/**
 * Validate invoice item values
 */
export function validateInvoiceItem(item: Partial<InvoiceItem>): string[] {
  const errors: string[] = [];

  if (!item.description || item.description.trim().length === 0) {
    errors.push('Description is required');
  }

  if (!item.quantity || item.quantity <= 0) {
    errors.push('Quantity must be greater than 0');
  }

  if (!item.unit_price || item.unit_price <= 0) {
    errors.push('Unit price must be greater than 0');
  }

  if (item.discount !== undefined && (item.discount < 0 || item.discount > 100)) {
    errors.push('Discount must be between 0% and 100%');
  }

  if (item.tax_rate !== undefined && (item.tax_rate < 0 || item.tax_rate > 100)) {
    errors.push('Tax rate must be between 0% and 100%');
  }

  return errors;
}

/**
 * Create a new blank invoice item
 */
export function createBlankInvoiceItem(): InvoiceItem {
  return {
    line_id: generateLineId(),
    description: '',
    quantity: 1,
    unit_price: 0,
    discount: 0,
    tax_rate: 0,
    subtotal: 0,
    discount_amount: 0,
    tax_amount: 0,
    total: 0,
  };
}

/**
 * Update invoice item calculations
 */
export function updateInvoiceItemCalculations(item: InvoiceItem): InvoiceItem {
  const calculations = calculateLineItem(
    item.quantity,
    item.unit_price,
    item.discount,
    item.tax_rate
  );

  return {
    ...item,
    ...calculations,
  };
}
