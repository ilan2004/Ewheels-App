import React from 'react';
import { Customer, UseCustomerSelectionOptions } from '@/types/customer';
import { useCustomerSelection } from '@/hooks/useCustomerSelection';
import { CustomerInputField } from './CustomerInputField';
import { CustomerPickerModal } from './CustomerPickerModal';
import { CustomerQuickAddModal } from './CustomerQuickAddModal';

export interface CustomerSelectionProps extends UseCustomerSelectionOptions {
  // Input field props
  value?: string;
  onChangeText?: (text: string) => void;
  placeholder?: string;
  label?: string;
  style?: any;
}

export const CustomerSelection: React.FC<CustomerSelectionProps> = ({
  locationId,
  onCustomerSelected,
  initialCustomer,
  value = '',
  onChangeText,
  placeholder,
  label,
  style,
}) => {
  const {
    selectedCustomer,
    linkedCustomerId,
    customerFormData,
    showPicker,
    showQuickAdd,
    selectCustomer,
    clearCustomerLink,
    updateCustomerFormData,
    openPicker,
    closePicker,
    openQuickAdd,
    closeQuickAdd,
    hasLinkedCustomer,
  } = useCustomerSelection({
    locationId,
    onCustomerSelected,
    initialCustomer,
  });

  const handleCustomerSelected = (customer: Customer) => {
    selectCustomer(customer);
    closePicker();
    if (onCustomerSelected) {
      onCustomerSelected(customer);
    }
  };

  const handleCustomerCreated = (customer: Customer) => {
    selectCustomer(customer);
    closeQuickAdd();
    if (onCustomerSelected) {
      onCustomerSelected(customer);
    }
  };

  const handleAddNewCustomer = () => {
    closePicker();
    openQuickAdd();
  };

  const handleInputChangeText = (text: string) => {
    if (onChangeText) {
      onChangeText(text);
    }
    updateCustomerFormData({ name: text });
  };

  return (
    <>
      {/* Input Field */}
      <CustomerInputField
        value={hasLinkedCustomer ? selectedCustomer?.name || '' : value}
        onChangeText={handleInputChangeText}
        linkedCustomer={selectedCustomer}
        onPress={openPicker}
        onClearLink={clearCustomerLink}
        placeholder={placeholder}
        label={label}
        style={style}
      />

      {/* Customer Picker Modal */}
      <CustomerPickerModal
        visible={showPicker}
        onClose={closePicker}
        onCustomerSelected={handleCustomerSelected}
        onAddNewCustomer={handleAddNewCustomer}
        locationId={locationId}
      />

      {/* Customer Quick Add Modal */}
      <CustomerQuickAddModal
        visible={showQuickAdd}
        onClose={closeQuickAdd}
        onCustomerCreated={handleCustomerCreated}
        locationId={locationId}
      />
    </>
  );
};

export default CustomerSelection;
