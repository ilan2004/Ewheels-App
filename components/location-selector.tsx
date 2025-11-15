import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  Dimensions,
} from 'react-native';
import { IconSymbol } from './ui/icon-symbol';
import { useLocationStore, Location } from '@/stores/locationStore';
import { useAuthStore } from '@/stores/authStore';
import { canBypassLocationFilter } from '@/lib/permissions';

interface LocationSelectorProps {
  style?: any;
  compact?: boolean; // For header use
}

export const LocationSelector: React.FC<LocationSelectorProps> = ({ 
  style, 
  compact = false 
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const { activeLocation, availableLocations, loading, switchLocation } = useLocationStore();
  const { user } = useAuthStore();
  
  // Don't show selector if user can bypass location filtering (admins, managers)
  // or if there's only one location
  const shouldShowSelector = user && 
    !canBypassLocationFilter(user.role) && 
    availableLocations.length > 1;

  if (!shouldShowSelector || loading) {
    return null;
  }

  const handleLocationSelect = async (location: Location) => {
    try {
      await switchLocation(location);
      setModalVisible(false);
    } catch (error) {
      console.error('Failed to switch location:', error);
    }
  };

  const renderLocationItem = ({ item }: { item: Location }) => (
    <TouchableOpacity
      style={[
        styles.locationItem,
        activeLocation?.id === item.id && styles.activeLocationItem
      ]}
      onPress={() => handleLocationSelect(item)}
    >
      <View style={styles.locationInfo}>
        <Text style={[
          styles.locationName,
          activeLocation?.id === item.id && styles.activeLocationName
        ]}>
          {item.name}
        </Text>
        {item.code && (
          <Text style={[
            styles.locationCode,
            activeLocation?.id === item.id && styles.activeLocationCode
          ]}>
            {item.code}
          </Text>
        )}
      </View>
      {activeLocation?.id === item.id && (
        <IconSymbol name="checkmark.circle.fill" size={20} color="#3B82F6" />
      )}
    </TouchableOpacity>
  );

  if (compact) {
    return (
      <>
        <TouchableOpacity
          style={[styles.compactSelector, style]}
          onPress={() => setModalVisible(true)}
        >
          <IconSymbol name="location" size={16} color="#6B7280" />
          <Text style={styles.compactLocationText}>
            {activeLocation?.name || 'Select Location'}
          </Text>
          <IconSymbol name="chevron.down" size={12} color="#9CA3AF" />
        </TouchableOpacity>

        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Location</Text>
                <TouchableOpacity
                  onPress={() => setModalVisible(false)}
                  style={styles.closeButton}
                >
                  <IconSymbol name="xmark" size={20} color="#6B7280" />
                </TouchableOpacity>
              </View>
              
              <FlatList
                data={availableLocations}
                keyExtractor={(item) => item.id}
                renderItem={renderLocationItem}
                style={styles.locationList}
                showsVerticalScrollIndicator={false}
              />
            </View>
          </View>
        </Modal>
      </>
    );
  }

  return (
    <>
      <TouchableOpacity
        style={[styles.selector, style]}
        onPress={() => setModalVisible(true)}
      >
        <View style={styles.selectorContent}>
          <View style={styles.locationIcon}>
            <IconSymbol name="location.fill" size={20} color="#3B82F6" />
          </View>
          <View style={styles.selectorText}>
            <Text style={styles.selectorLabel}>Location</Text>
            <Text style={styles.selectorValue}>
              {activeLocation?.name || 'Select Location'}
            </Text>
          </View>
        </View>
        <IconSymbol name="chevron.right" size={16} color="#9CA3AF" />
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Location</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}
              >
                <IconSymbol name="xmark" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalDescription}>
              Choose your active location. Data will be filtered to show only information 
              relevant to the selected location.
            </Text>
            
            <FlatList
              data={availableLocations}
              keyExtractor={(item) => item.id}
              renderItem={renderLocationItem}
              style={styles.locationList}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  selectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  locationIcon: {
    marginRight: 12,
  },
  selectorText: {
    flex: 1,
  },
  selectorLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  selectorValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  compactSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  compactLocationText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: Dimensions.get('window').height * 0.7,
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  closeButton: {
    padding: 4,
  },
  modalDescription: {
    fontSize: 14,
    color: '#6B7280',
    paddingHorizontal: 20,
    paddingVertical: 12,
    lineHeight: 20,
  },
  locationList: {
    paddingHorizontal: 20,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginVertical: 4,
    backgroundColor: '#F9FAFB',
  },
  activeLocationItem: {
    backgroundColor: '#EBF4FF',
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2,
  },
  activeLocationName: {
    color: '#1D4ED8',
  },
  locationCode: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '400',
  },
  activeLocationCode: {
    color: '#3B82F6',
  },
});
