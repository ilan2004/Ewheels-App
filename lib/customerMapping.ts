import { Customer, InvoiceCustomerData, CustomerMappingResult } from '@/types/customer';

/**
 * Maps a database Customer object to the invoice customer format
 * and returns both the invoice customer data and the linked customer ID
 */
export function mapCustomerForInvoice(customer: Customer): CustomerMappingResult {
  // Parse address if it's a single string
  const parseAddress = (address?: string) => {
    if (!address) return {};

    // Try to split address into components
    // This is a simple approach - you might want more sophisticated parsing
    const parts = address.split(',').map(part => part.trim());
    
    if (parts.length >= 3) {
      return {
        street: parts[0],
        city: parts[1],
        state: parts[2],
        zip: customer.postal_code || undefined,
        country: 'US', // Default country, you might want to make this configurable
      };
    } else if (parts.length >= 2) {
      return {
        street: parts[0],
        city: parts[1],
        state: customer.state || undefined,
        zip: customer.postal_code || undefined,
        country: 'US',
      };
    } else {
      return {
        street: address,
        city: customer.city || undefined,
        state: customer.state || undefined,
        zip: customer.postal_code || undefined,
        country: 'US',
      };
    }
  };

  const invoiceCustomer: InvoiceCustomerData = {
    name: customer.name,
    email: customer.email || undefined,
    phone: customer.phone || customer.contact || undefined,
    address: parseAddress(customer.address),
  };

  return {
    invoiceCustomer,
    linkedCustomerId: customer.id,
  };
}

/**
 * Creates a combined address string from customer data
 */
export function formatCustomerAddress(customer: Customer): string {
  const parts: string[] = [];

  if (customer.address) parts.push(customer.address);
  if (customer.city) parts.push(customer.city);
  if (customer.state) parts.push(customer.state);
  if (customer.postal_code) parts.push(customer.postal_code);

  return parts.join(', ');
}

/**
 * Gets the primary contact method for a customer
 */
export function getPrimaryContact(customer: Customer): string {
  if (customer.phone) return customer.phone;
  if (customer.contact) return customer.contact;
  if (customer.email) return customer.email;
  if (customer.alt_contact) return customer.alt_contact;
  return 'No contact info';
}

/**
 * Gets a display subtitle for customer (phone or email)
 */
export function getCustomerSubtitle(customer: Customer): string {
  if (customer.phone) return customer.phone;
  if (customer.email) return customer.email;
  if (customer.contact) return customer.contact;
  return '';
}

/**
 * Formats customer name with optional subtitle
 */
export function formatCustomerDisplay(customer: Customer): {
  title: string;
  subtitle: string;
} {
  return {
    title: customer.name,
    subtitle: getCustomerSubtitle(customer),
  };
}

/**
 * Validates customer data for invoice creation
 */
export function validateCustomerForInvoice(customer: Customer): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!customer.name?.trim()) {
    errors.push('Customer name is required');
  }

  // At least one contact method should be available
  const hasContact = customer.phone || customer.email || customer.contact || customer.alt_contact;
  if (!hasContact) {
    errors.push('At least one contact method (phone or email) is required');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Creates a customer search key for fuzzy matching
 */
export function createCustomerSearchKey(customer: Customer): string {
  return [
    customer.name,
    customer.phone,
    customer.email,
    customer.contact,
    customer.alt_contact,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

/**
 * Filters customers based on search query
 */
export function filterCustomers(customers: Customer[], query: string): Customer[] {
  if (!query.trim()) return customers;

  const searchTerm = query.toLowerCase().trim();
  
  return customers.filter(customer => {
    const searchKey = createCustomerSearchKey(customer);
    return searchKey.includes(searchTerm);
  });
}

/**
 * Sorts customers by relevance for search results
 */
export function sortCustomersByRelevance(customers: Customer[], query: string): Customer[] {
  if (!query.trim()) return customers;

  const searchTerm = query.toLowerCase().trim();

  return customers.sort((a, b) => {
    // Exact name match gets highest priority
    const aNameMatch = a.name.toLowerCase() === searchTerm;
    const bNameMatch = b.name.toLowerCase() === searchTerm;
    if (aNameMatch && !bNameMatch) return -1;
    if (!aNameMatch && bNameMatch) return 1;

    // Name starts with search term gets second priority
    const aNameStarts = a.name.toLowerCase().startsWith(searchTerm);
    const bNameStarts = b.name.toLowerCase().startsWith(searchTerm);
    if (aNameStarts && !bNameStarts) return -1;
    if (!aNameStarts && bNameStarts) return 1;

    // Phone number match gets third priority
    const aPhoneMatch = a.phone?.includes(searchTerm) || false;
    const bPhoneMatch = b.phone?.includes(searchTerm) || false;
    if (aPhoneMatch && !bPhoneMatch) return -1;
    if (!aPhoneMatch && bPhoneMatch) return 1;

    // Default to alphabetical order
    return a.name.localeCompare(b.name);
  });
}

/**
 * Debounce function for search input
 */
export function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
