import { useState, useCallback, useEffect } from 'react';
import {
  Customer,
  CustomerFormData,
  UseCustomerSelectionOptions,
  UseCustomerSelectionReturn,
} from '@/types/customer';

const initialFormData: CustomerFormData = {
  name: '',
  contact: '',
  phone: '',
  email: '',
  address: '',
  gst_number: '',
  city: '',
  state: '',
  postal_code: '',
  alt_contact: '',
  notes: '',
};

export const useCustomerSelection = (
  options: UseCustomerSelectionOptions = {}
): UseCustomerSelectionReturn => {
  const { locationId, onCustomerSelected, initialCustomer } = options;

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    initialCustomer || null
  );
  const [linkedCustomerId, setLinkedCustomerId] = useState<string | null>(
    initialCustomer?.id || null
  );
  const [customerFormData, setCustomerFormData] = useState<CustomerFormData>(() => {
    if (initialCustomer) {
      return {
        name: initialCustomer.name || '',
        contact: initialCustomer.contact || '',
        phone: initialCustomer.phone || '',
        email: initialCustomer.email || '',
        address: initialCustomer.address || '',
        gst_number: initialCustomer.gst_number || '',
        city: initialCustomer.city || '',
        state: initialCustomer.state || '',
        postal_code: initialCustomer.postal_code || '',
        alt_contact: initialCustomer.alt_contact || '',
        notes: initialCustomer.notes || '',
      };
    }
    return initialFormData;
  });
  const [showPicker, setShowPicker] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  // Initialize with initial customer if provided
  useEffect(() => {
    if (initialCustomer && !selectedCustomer) {
      setSelectedCustomer(initialCustomer);
      setLinkedCustomerId(initialCustomer.id);
      setCustomerFormData({
        name: initialCustomer.name || '',
        contact: initialCustomer.contact || '',
        phone: initialCustomer.phone || '',
        email: initialCustomer.email || '',
        address: initialCustomer.address || '',
        gst_number: initialCustomer.gst_number || '',
        city: initialCustomer.city || '',
        state: initialCustomer.state || '',
        postal_code: initialCustomer.postal_code || '',
        alt_contact: initialCustomer.alt_contact || '',
        notes: initialCustomer.notes || '',
      });
    }
  }, [initialCustomer, selectedCustomer]);

  const selectCustomer = useCallback(
    (customer: Customer) => {
      setSelectedCustomer(customer);
      setLinkedCustomerId(customer.id);
      
      // Auto-fill form data from selected customer
      setCustomerFormData({
        name: customer.name || '',
        contact: customer.contact || '',
        phone: customer.phone || '',
        email: customer.email || '',
        address: customer.address || '',
        gst_number: customer.gst_number || '',
        city: customer.city || '',
        state: customer.state || '',
        postal_code: customer.postal_code || '',
        alt_contact: customer.alt_contact || '',
        notes: customer.notes || '',
      });

      // Close modals
      setShowPicker(false);
      setShowQuickAdd(false);

      // Notify parent component
      if (onCustomerSelected) {
        onCustomerSelected(customer);
      }
    },
    [onCustomerSelected]
  );

  const clearCustomerLink = useCallback(() => {
    setSelectedCustomer(null);
    setLinkedCustomerId(null);
    // Keep form data as is - user might have edited it
  }, []);

  const updateCustomerFormData = useCallback(
    (data: Partial<CustomerFormData>) => {
      setCustomerFormData(prev => ({ ...prev, ...data }));
      
      // If user edits form data significantly, we might want to clear the link
      // This is optional - you can remove this logic if you want to keep the link always
      if (linkedCustomerId && data.name !== undefined && selectedCustomer) {
        // If name is significantly different, user might be creating a new customer
        if (data.name.trim() !== selectedCustomer.name.trim()) {
          // Don't auto-clear here - let user decide with clear link button
        }
      }
    },
    [linkedCustomerId, selectedCustomer]
  );

  const openPicker = useCallback(() => {
    setShowPicker(true);
    setShowQuickAdd(false);
  }, []);

  const closePicker = useCallback(() => {
    setShowPicker(false);
  }, []);

  const openQuickAdd = useCallback(() => {
    setShowQuickAdd(true);
    setShowPicker(false);
  }, []);

  const closeQuickAdd = useCallback(() => {
    setShowQuickAdd(false);
  }, []);

  const hasLinkedCustomer = Boolean(selectedCustomer && linkedCustomerId);

  return {
    // State
    selectedCustomer,
    linkedCustomerId,
    customerFormData,
    showPicker,
    showQuickAdd,

    // Actions
    selectCustomer,
    clearCustomerLink,
    updateCustomerFormData,
    openPicker,
    closePicker,
    openQuickAdd,
    closeQuickAdd,

    // Computed
    hasLinkedCustomer,
  };
};
