export interface Customer {
  id: string;
  name: string;
  contact?: string;
  phone?: string;
  email?: string;
  address?: string;
  gst_number?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  alt_contact?: string;
  notes?: string;
  location_id?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface CreateCustomerRequest {
  name: string;
  contact?: string;
  phone?: string;
  email?: string;
  address?: string;
  gst_number?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  alt_contact?: string;
  notes?: string;
  location_id?: string;
}

export interface UpdateCustomerRequest extends Partial<CreateCustomerRequest> {
  id: string;
}

export interface CustomerSearchFilters {
  query?: string;
  location_id?: string;
  limit?: number;
  offset?: number;
}

export interface CustomerSearchResponse {
  customers: Customer[];
  total: number;
  hasMore: boolean;
}

export interface CustomerFormData {
  name: string;
  contact: string;
  phone: string;
  email: string;
  address: string;
  gst_number: string;
  city: string;
  state: string;
  postal_code: string;
  alt_contact: string;
  notes: string;
}

// For invoice integration
export interface InvoiceCustomerData {
  name: string;
  email?: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  };
}

export interface CustomerMappingResult {
  invoiceCustomer: InvoiceCustomerData;
  linkedCustomerId: string;
}

export interface CustomerListItem {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
}

// API Response types
export interface CreateCustomerResponse {
  success: boolean;
  data?: Customer;
  error?: string;
}

export interface GetCustomerResponse {
  success: boolean;
  data?: Customer;
  error?: string;
}

export interface CustomerPickerProps {
  visible: boolean;
  onClose: () => void;
  onCustomerSelected: (customer: Customer) => void;
  locationId?: string;
}

export interface CustomerQuickAddProps {
  visible: boolean;
  onClose: () => void;
  onCustomerCreated: (customer: Customer) => void;
  locationId?: string;
}

export interface CustomerListProps {
  customers: Customer[];
  onCustomerSelect: (customer: Customer) => void;
  loading?: boolean;
  emptyMessage?: string;
}

// Customer Selection UI Types
export interface CustomerSelectionState {
  selectedCustomer: Customer | null;
  linkedCustomerId: string | null;
  showPicker: boolean;
  showQuickAdd: boolean;
  customerFormData: CustomerFormData;
}

export interface CustomerInputFieldProps {
  value: string;
  onChangeText: (text: string) => void;
  linkedCustomer: Customer | null;
  onPress: () => void;
  onClearLink: () => void;
  placeholder?: string;
  label?: string;
  style?: any;
}

export interface CustomerPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onCustomerSelected: (customer: Customer) => void;
  onAddNewCustomer: () => void;
  locationId?: string;
}

export interface CustomerQuickAddModalProps {
  visible: boolean;
  onClose: () => void;
  onCustomerCreated: (customer: Customer) => void;
  locationId?: string;
}

export interface UseCustomerSelectionOptions {
  locationId?: string;
  onCustomerSelected?: (customer: Customer) => void;
  initialCustomer?: Customer | null;
}

export interface UseCustomerSelectionReturn {
  // State
  selectedCustomer: Customer | null;
  linkedCustomerId: string | null;
  customerFormData: CustomerFormData;
  showPicker: boolean;
  showQuickAdd: boolean;
  
  // Actions
  selectCustomer: (customer: Customer) => void;
  clearCustomerLink: () => void;
  updateCustomerFormData: (data: Partial<CustomerFormData>) => void;
  openPicker: () => void;
  closePicker: () => void;
  openQuickAdd: () => void;
  closeQuickAdd: () => void;
  
  // Computed
  hasLinkedCustomer: boolean;
}

export interface CustomerFormValidation {
  name: string | null;
  email: string | null;
  phone: string | null;
}

export interface CustomerSearchItem {
  id: string;
  name: string;
  phone?: string;
  contact?: string;
  email?: string;
  subtitle: string;
}
