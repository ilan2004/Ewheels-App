import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';

export interface Location {
  id: string;
  name: string;
  code?: string | null;
}

export interface UserLocation {
  location_id: string;
  location: Location;
}

interface LocationStore {
  // Current active location
  activeLocation: Location | null;
  
  // Available locations for the current user
  availableLocations: Location[];
  
  // Loading states
  loading: boolean;
  initializing: boolean;
  
  // Actions
  setActiveLocation: (location: Location | null) => void;
  setAvailableLocations: (locations: Location[]) => void;
  setLoading: (loading: boolean) => void;
  setInitializing: (initializing: boolean) => void;
  
  // Async actions
  fetchUserLocations: (userId: string) => Promise<void>;
  switchLocation: (location: Location) => Promise<void>;
  initializeLocation: (userId: string) => Promise<void>;
  clearLocationData: () => void;
}

const ACTIVE_LOCATION_STORAGE_KEY = 'activeLocation';

export const useLocationStore = create<LocationStore>((set, get) => ({
  activeLocation: null,
  availableLocations: [],
  loading: false,
  initializing: true,

  setActiveLocation: (location) => set({ activeLocation: location }),
  setAvailableLocations: (locations) => set({ availableLocations: locations }),
  setLoading: (loading) => set({ loading }),
  setInitializing: (initializing) => set({ initializing }),

  fetchUserLocations: async (userId: string) => {
    try {
      set({ loading: true });

      // Fetch user's assigned locations
      const { data: userLocations, error: userLocationError } = await supabase
        .from('user_locations')
        .select(`
          location_id,
          locations(id, name, code)
        `)
        .eq('user_id', userId);

      if (userLocationError) {
        // If user_locations table doesn't exist or user has no locations assigned,
        // fetch all available locations (admin behavior)
        console.warn('User locations not found, fetching all locations:', userLocationError);
        
        const { data: allLocations, error: allLocationError } = await supabase
          .from('locations')
          .select('id, name, code')
          .order('name', { ascending: true });

        if (allLocationError) {
          // Fallback to default location if locations table doesn't exist
          console.warn('Locations table not found, using default location:', allLocationError);
          set({ 
            availableLocations: [{ id: 'default', name: 'Default Location', code: 'DEFAULT' }],
            loading: false 
          });
          return;
        }

        set({ 
          availableLocations: allLocations || [],
          loading: false 
        });
        return;
      }

      // Extract locations from user_locations join result
      const locations = userLocations
        ?.map(ul => ul.locations)
        .filter(Boolean) as Location[] || [];

      set({ 
        availableLocations: locations,
        loading: false 
      });

    } catch (error) {
      console.warn('Error fetching user locations:', error);
      // Fallback to default location
      set({ 
        availableLocations: [{ id: 'default', name: 'Default Location', code: 'DEFAULT' }],
        loading: false 
      });
    }
  },

  switchLocation: async (location: Location) => {
    try {
      set({ loading: true, activeLocation: location });
      
      // Persist the active location
      await AsyncStorage.setItem(ACTIVE_LOCATION_STORAGE_KEY, JSON.stringify(location));
      
      set({ loading: false });
    } catch (error) {
      console.warn('Error switching location:', error);
      set({ loading: false });
    }
  },

  initializeLocation: async (userId: string) => {
    try {
      set({ initializing: true });

      // Fetch available locations first
      await get().fetchUserLocations(userId);

      // Try to restore previously selected location
      const storedLocation = await AsyncStorage.getItem(ACTIVE_LOCATION_STORAGE_KEY);
      let activeLocation: Location | null = null;

      if (storedLocation) {
        try {
          const parsedLocation = JSON.parse(storedLocation) as Location;
          
          // Check if stored location is still available to user
          const isLocationAvailable = get().availableLocations.some(
            loc => loc.id === parsedLocation.id
          );

          if (isLocationAvailable) {
            activeLocation = parsedLocation;
          }
        } catch (error) {
          console.warn('Error parsing stored location:', error);
        }
      }

      // If no valid stored location, use first available location
      if (!activeLocation && get().availableLocations.length > 0) {
        activeLocation = get().availableLocations[0];
        await AsyncStorage.setItem(ACTIVE_LOCATION_STORAGE_KEY, JSON.stringify(activeLocation));
      }

      set({ 
        activeLocation,
        initializing: false 
      });

    } catch (error) {
      console.warn('Error initializing location:', error);
      set({ 
        activeLocation: null,
        initializing: false 
      });
    }
  },

  clearLocationData: () => {
    set({
      activeLocation: null,
      availableLocations: [],
      loading: false,
      initializing: true,
    });
    
    // Clear stored location
    AsyncStorage.removeItem(ACTIVE_LOCATION_STORAGE_KEY).catch(console.warn);
  },
}));
