import { InvoiceItem, InvoiceTotals } from '@/types/invoice';

export const DEFAULT_INVOICE_CONFIG = {
  currency: 'INR',
  locale: 'en-IN',
  sgstRate: 9,
  cgstRate: 9,
};

export function roundToDecimalPlaces(value: number, places: number = 2): number {
  return Math.round(value * Math.pow(10, places)) / Math.pow(10, places);
}

export function createBlankInvoiceItem(): InvoiceItem {
  return updateInvoiceItemCalculations({
    id: `temp-${Date.now()}`,
    description: '',
    quantity: 1,
    unit_price: 0,
    discount: 0,
    sgst_rate: DEFAULT_INVOICE_CONFIG.sgstRate,
    cgst_rate: DEFAULT_INVOICE_CONFIG.cgstRate,
    subtotal: 0,
    discount_amount: 0,
    sgst_amount: 0,
    cgst_amount: 0,
    total: 0,
  });
}

export function updateInvoiceItemCalculations(item: InvoiceItem): InvoiceItem {
  const quantity = Math.max(0, item.quantity || 0);
  const unitPrice = Math.max(0, item.unit_price || 0);
  const discount = Math.max(0, Math.min(100, item.discount || 0));
  const sgstRate = Math.max(0, Math.min(100, item.sgst_rate || 0));
  const cgstRate = Math.max(0, Math.min(100, item.cgst_rate || 0));

  const subtotal = roundToDecimalPlaces(quantity * unitPrice);
  const discountAmount = roundToDecimalPlaces(subtotal * (discount / 100));
  const taxableAmount = subtotal - discountAmount;

  const sgstAmount = roundToDecimalPlaces(taxableAmount * (sgstRate / 100));
  const cgstAmount = roundToDecimalPlaces(taxableAmount * (cgstRate / 100));

  const total = roundToDecimalPlaces(taxableAmount + sgstAmount + cgstAmount);

  return {
    ...item,
    quantity,
    unit_price: unitPrice,
    discount,
    sgst_rate: sgstRate,
    cgst_rate: cgstRate,
    subtotal,
    discount_amount: discountAmount,
    sgst_amount: sgstAmount,
    cgst_amount: cgstAmount,
    total,
  };
}

export function calculateInvoiceTotals(
  items: InvoiceItem[],
  shippingAmount: number = 0,
  adjustmentAmount: number = 0
): InvoiceTotals {
  const subtotal = roundToDecimalPlaces(
    items.reduce((sum, item) => sum + item.subtotal, 0)
  );
  const discountTotal = roundToDecimalPlaces(
    items.reduce((sum, item) => sum + item.discount_amount, 0)
  );
  const sgstTotal = roundToDecimalPlaces(
    items.reduce((sum, item) => sum + item.sgst_amount, 0)
  );
  const cgstTotal = roundToDecimalPlaces(
    items.reduce((sum, item) => sum + item.cgst_amount, 0)
  );

  const grandTotal = roundToDecimalPlaces(
    subtotal - discountTotal + sgstTotal + cgstTotal + shippingAmount + adjustmentAmount
  );

  return {
    subtotal,
    discount_total: discountTotal,
    sgst_total: sgstTotal,
    cgst_total: cgstTotal,
    shipping_amount: shippingAmount,
    adjustment_amount: adjustmentAmount,
    grand_total: grandTotal,
  };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(amount);
}

export function validateInvoiceItem(item: InvoiceItem): string[] {
  const errors: string[] = [];
  if (!item.description?.trim()) errors.push('Description is required');
  if (item.quantity <= 0) errors.push('Quantity must be greater than 0');
  if (item.unit_price < 0) errors.push('Unit price cannot be negative');
  return errors;
}
