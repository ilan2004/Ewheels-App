import { supabase } from '@/lib/supabase';
import { User, UserRole } from '@/types';
import { create } from 'zustand';
import { useLocationStore } from './locationStore';

interface AuthStore {
  user: User | null;
  loading: boolean;
  initialized: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setInitialized: (initialized: boolean) => void;
  signIn: (identifier: string, password: string, selectedLocationId?: string) => Promise<void>;
  signOut: () => Promise<void>;
  checkAuthState: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  loading: true,
  initialized: false,

  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
  setInitialized: (initialized) => set({ initialized }),

  signIn: async (identifier: string, password: string, selectedLocationId?: string) => {
    try {
      set({ loading: true });

      let email = identifier;

      // Check if identifier is an email
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);

      if (!isEmail) {
        // It's a username, try to find the email
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('email')
          .eq('username', identifier)
          .single();

        if (profileError || !profile?.email) {
          throw new Error('Username not found. Please check your username or use your email.');
        }

        email = profile.email;
      }

      // Demo credentials only in mock mode
      if (process.env.EXPO_PUBLIC_USE_MOCK_API === 'true' && email.includes('@evwheels.com')) {
        // Create a mock user for development with consistent IDs for technicians
        let userId = 'mock-user-id-' + Date.now();

        // Use consistent tech IDs for technicians to match mock ticket assignments
        if (email.includes('tech1')) userId = 'tech_001';
        else if (email.includes('tech2')) userId = 'tech_002';
        else if (email.includes('tech3')) userId = 'tech_003';
        else if (email.includes('tech') && email.match(/tech(\d+)/)) {
          const techNum = email.match(/tech(\d+)/)![1];
          userId = `tech_${techNum.padStart(3, '0')}`;
        }

        const mockUser: User = {
          id: userId,
          email: email,
          firstName: email.includes('floormanager') ? 'Floor' :
            email.includes('manager') ? 'Front Desk' :
              email.includes('tech') ? 'Tech' : 'Admin',
          lastName: email.includes('floormanager') ? 'Manager' :
            email.includes('manager') ? 'Manager' :
              email.includes('tech') ? 'User' : 'User',
          role: email.includes('floormanager') ? 'floor_manager' :
            email.includes('manager') ? 'front_desk_manager' :
              email.includes('tech') ? 'technician' : 'admin',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        set({ user: mockUser, loading: false });
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        // Fetch user profile and role from profiles and app_roles tables (two-step approach)
        const [profileResult, roleResult] = await Promise.all([
          supabase
            .from('profiles')
            .select('*')
            .eq('user_id', data.user.id)
            .single(),
          supabase
            .from('app_roles')
            .select('role')
            .eq('user_id', data.user.id)
            .single()
        ]);

        if (profileResult.error || roleResult.error) {
          console.warn('Profile/Role tables not found, creating default user profile:', {
            profileError: profileResult.error,
            roleError: roleResult.error
          });
          // Create a default user profile if profile/role tables don't exist
          const defaultProfile = {
            username: data.user.user_metadata?.username || data.user.email?.split('@')[0] || 'User',
            email: data.user.email || '',
            role: 'admin', // Default role - you can change this
          };

          const userWithRole: User = {
            id: data.user.id,
            email: data.user.email!,
            firstName: defaultProfile.username,
            lastName: '',
            role: defaultProfile.role as UserRole,
            createdAt: data.user.created_at!,
            updatedAt: new Date().toISOString(),
          };

          set({ user: userWithRole, loading: false });

          // Initialize location data
          try {
            await useLocationStore.getState().initializeLocation(data.user.id);
          } catch (error) {
            console.warn('Failed to initialize location data:', error);
          }

          return;
        }

        const profile = profileResult.data;
        const roleData = roleResult.data;

        const userWithRole: User = {
          id: data.user.id,
          email: data.user.email!,
          firstName: profile.first_name || profile.username || profile.email?.split('@')[0] || 'User',
          lastName: profile.last_name || '',
          role: roleData.role as UserRole,
          createdAt: data.user.created_at!,
          updatedAt: profile.updated_at || new Date().toISOString(),
        };

        // Verify branch access if a location was selected
        // Admins can access all branches
        if (selectedLocationId && roleData.role !== 'admin') {
          const { data: userLocation, error: locationError } = await supabase
            .from('user_locations')
            .select('location_id')
            .eq('user_id', data.user.id)
            .eq('location_id', selectedLocationId)
            .single();

          if (locationError || !userLocation) {
            // User is not assigned to this branch
            await supabase.auth.signOut();
            throw new Error('You do not have access to this branch.');
          }
        }

        set({ user: userWithRole, loading: false });

        // Initialize location data after successful login
        try {
          await useLocationStore.getState().initializeLocation(data.user.id);
        } catch (error) {
          console.warn('Failed to initialize location data:', error);
        }
      }
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  signOut: async () => {
    try {
      set({ loading: true });
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      // Clear location data on sign out
      useLocationStore.getState().clearLocationData();

      set({ user: null, loading: false });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  checkAuthState: async () => {
    try {
      set({ loading: true });

      // In development mode, just set initialized to true if no session
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.warn('Supabase connection error (development mode):', error.message);
        set({ user: null, loading: false, initialized: true });
        return;
      }

      if (session?.user) {
        // Fetch user profile and role from profiles and app_roles tables (two-step approach)
        const [profileResult, roleResult] = await Promise.all([
          supabase
            .from('profiles')
            .select('*')
            .eq('user_id', session.user.id)
            .single(),
          supabase
            .from('app_roles')
            .select('role')
            .eq('user_id', session.user.id)
            .single()
        ]);

        if (profileResult.error || roleResult.error) {
          console.warn('Profile/Role tables not found, creating default user profile:', {
            profileError: profileResult.error,
            roleError: roleResult.error
          });
          // Create a default user profile if profile/role tables don't exist
          const defaultProfile = {
            username: session.user.user_metadata?.username || session.user.email?.split('@')[0] || 'User',
            email: session.user.email || '',
            role: 'admin', // Default role - you can change this
          };

          const userWithRole: User = {
            id: session.user.id,
            email: session.user.email!,
            firstName: defaultProfile.username,
            lastName: '',
            role: defaultProfile.role as UserRole,
            createdAt: session.user.created_at!,
            updatedAt: new Date().toISOString(),
          };

          set({ user: userWithRole, loading: false, initialized: true });

          // Initialize location data
          try {
            await useLocationStore.getState().initializeLocation(session.user.id);
          } catch (error) {
            console.warn('Failed to initialize location data:', error);
          }

          return;
        }

        const profile = profileResult.data;
        const roleData = roleResult.data;

        const userWithRole: User = {
          id: session.user.id,
          email: session.user.email!,
          firstName: profile.first_name || profile.username || profile.email?.split('@')[0] || 'User',
          lastName: profile.last_name || '',
          role: roleData.role as UserRole,
          createdAt: session.user.created_at!,
          updatedAt: profile.updated_at || new Date().toISOString(),
        };

        set({ user: userWithRole, loading: false, initialized: true });

        // Initialize location data
        try {
          await useLocationStore.getState().initializeLocation(session.user.id);
        } catch (error) {
          console.warn('Failed to initialize location data:', error);
        }
      } else {
        set({ user: null, loading: false, initialized: true });
      }
    } catch (error) {
      console.warn('Error checking auth state (development mode):', error);
      set({ user: null, loading: false, initialized: true });
    }
  },
}));

// Set up auth state listener
try {
  supabase.auth.onAuthStateChange((event, session) => {
    const { checkAuthState } = useAuthStore.getState();

    if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
      checkAuthState();
    }
  });
} catch (error) {
  console.warn('Could not set up auth state listener (development mode):', error);
}
