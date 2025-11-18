import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';

// Types
export interface MediaFilters {
  mediaType?: 'image' | 'video' | 'audio';
  ticketId?: string;
  syncStatus?: 'pending' | 'synced' | 'failed';
  dateRange?: {
    from: string;
    to: string;
  };
  searchQuery?: string;
}

export interface MediaItem {
  id: string;
  ticketId?: string;
  userId: string;
  mediaType: 'image' | 'video' | 'audio';
  fileName: string;
  localUri?: string;
  remoteUrl?: string;
  supabasePath?: string;
  fileSize?: number;
  durationSeconds?: number;
  width?: number;
  height?: number;
  metadata: Record<string, any>;
  assignedAt?: string;
  createdAt: string;
  updatedAt: string;
  // UI states
  uploading?: boolean;
  uploadProgress?: number;
  syncStatus?: 'pending' | 'syncing' | 'synced' | 'failed';
}

export interface ServiceTicket {
  id: string;
  ticket_number: string;
  customer_complaint: string;
  status: string;
  priority: number;
  created_at: string;
}

export interface MediaHubState {
  // Data
  mediaItems: MediaItem[];
  filteredItems: MediaItem[];
  serviceTickets: ServiceTicket[];
  
  // UI State
  activeTab: 'capture' | 'audio' | 'library' | 'search';
  loading: boolean;
  error: string | null;
  viewMode: 'grid' | 'list';
  
  // Comprehensive Filters
  filters: MediaFilters;
  
  // Legacy filters for backward compatibility
  mediaTypeFilter: 'all' | 'image' | 'video' | 'audio';
  ticketFilter: string | null;
  dateRangeFilter: {
    start?: string;
    end?: string;
  };
  searchQuery: string;
  
  // Selection (for bulk operations)
  selectedItems: string[];
  
  // Actions
  setActiveTab: (tab: 'capture' | 'audio' | 'library' | 'search') => void;
  setViewMode: (mode: 'grid' | 'list') => void;
  setFilters: (filters: Partial<MediaFilters>) => void;
  applyFilters: () => void;
  resetFilters: () => void;
  
  // Legacy filter actions (for backward compatibility)
  setMediaTypeFilter: (filter: 'all' | 'image' | 'video' | 'audio') => void;
  setTicketFilter: (ticketId: string | null) => void;
  setDateRangeFilter: (range: { start?: string; end?: string }) => void;
  setSearchQuery: (query: string) => void;
  
  // Selection actions
  toggleItemSelection: (itemId: string) => void;
  clearSelection: () => void;
  selectAll: () => void;
  
  // Data operations
  loadMediaItems: () => Promise<void>;
  loadServiceTickets: () => Promise<void>;
  createMediaItem: (data: Partial<MediaItem>) => Promise<MediaItem>;
  updateMediaItem: (id: string, updates: Partial<MediaItem>) => Promise<void>;
  deleteMediaItem: (id: string) => Promise<void>;
  assignMediaToTicket: (mediaIds: string[], ticketId: string) => Promise<void>;
  assignToTicket: (itemIds: string[], ticketId: string | null) => Promise<void>;
  uploadToSupabase: (item: MediaItem) => Promise<void>;
  
  // Computed
  getFilteredItems: () => MediaItem[];
  getItemsByTicket: (ticketId: string) => MediaItem[];
  getUnassignedItems: () => MediaItem[];
}

const SUPABASE_BUCKET = 'media-items';

let searchTimeout: NodeJS.Timeout | null = null;

export const useMediaHubStore = create<MediaHubState>((set, get) => ({
  // Initial state
  mediaItems: [],
  filteredItems: [],
  serviceTickets: [],
  activeTab: 'capture',
  loading: false,
  error: null,
  viewMode: 'grid',
  
  // Comprehensive filters
  filters: {},
  
  // Legacy filters
  mediaTypeFilter: 'all',
  ticketFilter: null,
  dateRangeFilter: {},
  searchQuery: '',
  selectedItems: [],

  // Actions
  setActiveTab: (tab) => set({ activeTab: tab }),
  
  setViewMode: (mode) => set({ viewMode: mode }),
  
  setFilters: (newFilters) => {
    set((state) => ({ 
      filters: { ...state.filters, ...newFilters },
      selectedItems: []
    }));
    
    // Debounced filter application for search
    if (newFilters.searchQuery !== undefined) {
      if (searchTimeout) clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        get().applyFilters();
      }, 300);
    } else {
      get().applyFilters();
    }
  },
  
  applyFilters: () => {
    const { mediaItems, filters } = get();
    let filtered = [...mediaItems];

    // Filter by media type
    if (filters.mediaType) {
      filtered = filtered.filter(item => item.mediaType === filters.mediaType);
    }

    // Filter by ticket
    if (filters.ticketId) {
      if (filters.ticketId === 'unassigned') {
        filtered = filtered.filter(item => !item.ticketId);
      } else {
        filtered = filtered.filter(item => item.ticketId === filters.ticketId);
      }
    }

    // Filter by sync status
    if (filters.syncStatus) {
      filtered = filtered.filter(item => item.syncStatus === filters.syncStatus);
    }

    // Filter by date range
    if (filters.dateRange) {
      const { from, to } = filters.dateRange;
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.createdAt);
        const fromDate = from ? new Date(from) : null;
        const toDate = to ? new Date(to) : null;
        
        if (fromDate && itemDate < fromDate) return false;
        if (toDate && itemDate > toDate) return false;
        return true;
      });
    }

    // Filter by search query (filename and metadata)
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(item => 
        item.fileName.toLowerCase().includes(query) ||
        item.metadata?.originalName?.toLowerCase().includes(query) ||
        item.metadata?.description?.toLowerCase()?.includes(query)
      );
    }

    set({ filteredItems: filtered });
  },
  
  resetFilters: () => {
    set({ 
      filters: {},
      filteredItems: get().mediaItems,
      selectedItems: []
    });
  },
  
  setMediaTypeFilter: (filter) => set({ 
    mediaTypeFilter: filter,
    selectedItems: [] 
  }),
  
  setTicketFilter: (ticketId) => set({ 
    ticketFilter: ticketId,
    selectedItems: [] 
  }),
  
  setDateRangeFilter: (range) => set({ 
    dateRangeFilter: range,
    selectedItems: [] 
  }),
  
  setSearchQuery: (query) => set({ 
    searchQuery: query,
    selectedItems: [] 
  }),
  
  toggleItemSelection: (itemId) => set((state) => ({
    selectedItems: state.selectedItems.includes(itemId)
      ? state.selectedItems.filter(id => id !== itemId)
      : [...state.selectedItems, itemId]
  })),
  
  clearSelection: () => set({ selectedItems: [] }),
  
  selectAll: () => {
    const filteredItems = get().getFilteredItems();
    set({ selectedItems: filteredItems.map(item => item.id) });
  },

  // Data operations
  loadMediaItems: async () => {
    try {
      set({ loading: true, error: null });
      
      const { data, error } = await supabase
        .from('media_items')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const rows = data || [];

      // Normalize DB rows (snake_case) into our MediaItem shape (camelCase)
      const mediaItems: MediaItem[] = rows.map((row: any) => ({
        id: row.id,
        ticketId: row.ticket_id,
        userId: row.user_id,
        mediaType: row.media_type,
        fileName: row.file_name,
        localUri: row.local_uri,
        remoteUrl: row.remote_url,
        supabasePath: row.supabase_path,
        fileSize: row.file_size,
        durationSeconds: row.duration_seconds,
        width: row.width,
        height: row.height,
        metadata: row.metadata || {},
        assignedAt: row.assigned_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        // If sync_status column exists, use it; otherwise infer from remote_url
        syncStatus: (row.sync_status as MediaItem['syncStatus']) || (row.remote_url ? 'synced' : 'pending'),
      }));

      set({ 
        mediaItems,
        filteredItems: mediaItems, // Initialize filtered items
        loading: false 
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load media items',
        loading: false 
      });
    }
  },

  loadServiceTickets: async () => {
    try {
      const { data, error } = await supabase
        .from('service_tickets')
        .select('id, ticket_number, customer_complaint, status, priority, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;

      set({ serviceTickets: data || [] });
    } catch (error) {
      console.error('Failed to load service tickets:', error);
    }
  },

  createMediaItem: async (data) => {
    try {
      const newItem: Partial<MediaItem> = {
        ...data,
        userId: data.userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        syncStatus: 'pending',
      };

      const { data: created, error } = await supabase
        .from('media_items')
        .insert([{
          ticket_id: newItem.ticketId,
          user_id: newItem.userId,
          media_type: newItem.mediaType,
          file_name: newItem.fileName,
          local_uri: newItem.localUri,
          remote_url: newItem.remoteUrl,
          supabase_path: newItem.supabasePath,
          file_size: newItem.fileSize,
          duration_seconds: newItem.durationSeconds,
          width: newItem.width,
          height: newItem.height,
          metadata: newItem.metadata || {},
          assigned_at: newItem.assignedAt,
        }])
        .select()
        .single();

      if (error) throw error;

      const mediaItem: MediaItem = {
        id: created.id,
        ticketId: created.ticket_id,
        userId: created.user_id,
        mediaType: created.media_type,
        fileName: created.file_name,
        localUri: created.local_uri,
        remoteUrl: created.remote_url,
        supabasePath: created.supabase_path,
        fileSize: created.file_size,
        durationSeconds: created.duration_seconds,
        width: created.width,
        height: created.height,
        metadata: created.metadata || {},
        assignedAt: created.assigned_at,
        createdAt: created.created_at,
        updatedAt: created.updated_at,
        syncStatus: 'pending',
      };

      set((state) => ({
        mediaItems: [mediaItem, ...state.mediaItems]
      }));

      return mediaItem;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to create media item');
    }
  },

  updateMediaItem: async (id, updates) => {
    try {
      const { error } = await supabase
        .from('media_items')
        .update({
          ticket_id: updates.ticketId,
          file_name: updates.fileName,
          remote_url: updates.remoteUrl,
          supabase_path: updates.supabasePath,
          assigned_at: updates.assignedAt,
        })
        .eq('id', id);

      if (error) throw error;

      set((state) => ({
        mediaItems: state.mediaItems.map(item =>
          item.id === id 
            ? { ...item, ...updates, updatedAt: new Date().toISOString() }
            : item
        )
      }));
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to update media item');
    }
  },

  deleteMediaItem: async (id) => {
    try {
      const item = get().mediaItems.find(item => item.id === id);
      if (!item) return;

      // Delete from Supabase
      const { error } = await supabase
        .from('media_items')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Delete local file if exists
      if (item.localUri) {
        try {
          await FileSystem.deleteAsync(item.localUri, { idempotent: true });
        } catch (fileError) {
          console.warn('Failed to delete local file:', fileError);
        }
      }

      // Delete from Supabase Storage if exists
      if (item.supabasePath) {
        try {
          await supabase.storage
            .from(SUPABASE_BUCKET)
            .remove([item.supabasePath]);
        } catch (storageError) {
          console.warn('Failed to delete from Supabase storage:', storageError);
        }
      }

      set((state) => ({
        mediaItems: state.mediaItems.filter(item => item.id !== id),
        selectedItems: state.selectedItems.filter(itemId => itemId !== id)
      }));
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to delete media item');
    }
  },

  assignMediaToTicket: async (mediaIds: string[], ticketId: string) => {
    try {
      const assignedAt = new Date().toISOString();
      
      const { error } = await supabase
        .from('media_items')
        .update({
          ticket_id: ticketId,
          assigned_at: assignedAt,
          updated_at: assignedAt
        })
        .in('id', mediaIds);

      if (error) throw error;

      // Update local state
      set((state) => {
        const updatedItems = state.mediaItems.map(item =>
          mediaIds.includes(item.id)
            ? { ...item, ticketId, assignedAt, updatedAt: assignedAt }
            : item
        );
        
        return {
          mediaItems: updatedItems,
          filteredItems: state.filteredItems.map(item =>
            mediaIds.includes(item.id)
              ? { ...item, ticketId, assignedAt, updatedAt: assignedAt }
              : item
          ),
          selectedItems: []
        };
      });
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to assign media to ticket');
    }
  },

  assignToTicket: async (itemIds, ticketId) => {
    try {
      const assignedAt = ticketId ? new Date().toISOString() : null;
      
      const { error } = await supabase
        .from('media_items')
        .update({
          ticket_id: ticketId,
          assigned_at: assignedAt,
        })
        .in('id', itemIds);

      if (error) throw error;

      set((state) => {
        const updatedItems = state.mediaItems.map(item =>
          itemIds.includes(item.id)
            ? { ...item, ticketId, assignedAt, updatedAt: new Date().toISOString() }
            : item
        );
        
        return {
          mediaItems: updatedItems,
          filteredItems: state.filteredItems.map(item =>
            itemIds.includes(item.id)
              ? { ...item, ticketId, assignedAt, updatedAt: new Date().toISOString() }
              : item
          ),
          selectedItems: []
        };
      });
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to assign media items');
    }
  },

  uploadToSupabase: async (item) => {
    if (!item.localUri) return;
    
    try {
      set((state) => ({
        mediaItems: state.mediaItems.map(i =>
          i.id === item.id 
            ? { ...i, syncStatus: 'syncing', uploadProgress: 0 }
            : i
        )
      }));

      const fileName = `${item.id}_${item.fileName}`;
      const supabasePath = `${item.userId}/${fileName}`;

      // Upload file
      const formData = new FormData();
      formData.append('file', {
        uri: item.localUri,
        name: fileName,
        type: item.mediaType === 'image' ? 'image/jpeg' : 
              item.mediaType === 'video' ? 'video/mp4' : 'audio/m4a',
      } as any);

      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
      
      const uploadUrl = `${supabaseUrl}/storage/v1/object/${SUPABASE_BUCKET}/${supabasePath}`;

      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'apikey': supabaseKey!,
          'Authorization': `Bearer ${supabaseKey}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(SUPABASE_BUCKET)
        .getPublicUrl(supabasePath);

      // Update database with remote URL
      await get().updateMediaItem(item.id, {
        remoteUrl: urlData.publicUrl,
        supabasePath,
        syncStatus: 'synced',
      });

    } catch (error) {
      set((state) => ({
        mediaItems: state.mediaItems.map(i =>
          i.id === item.id 
            ? { ...i, syncStatus: 'failed' }
            : i
        )
      }));
      throw error;
    }
  },

  // Computed getters
  getFilteredItems: () => {
    const state = get();
    
    // Return already filtered items if using new filter system
    if (Object.keys(state.filters).length > 0) {
      return state.filteredItems;
    }
    
    // Legacy filtering for backward compatibility
    let items = state.mediaItems;

    // Filter by media type
    if (state.mediaTypeFilter !== 'all') {
      items = items.filter(item => item.mediaType === state.mediaTypeFilter);
    }

    // Filter by ticket
    if (state.ticketFilter) {
      items = items.filter(item => item.ticketId === state.ticketFilter);
    }

    // Filter by search query
    if (state.searchQuery) {
      const query = state.searchQuery.toLowerCase();
      items = items.filter(item => 
        item.fileName.toLowerCase().includes(query) ||
        item.metadata?.description?.toLowerCase()?.includes(query)
      );
    }

    // Filter by date range
    if (state.dateRangeFilter.start || state.dateRangeFilter.end) {
      items = items.filter(item => {
        const itemDate = new Date(item.createdAt);
        const start = state.dateRangeFilter.start ? new Date(state.dateRangeFilter.start) : null;
        const end = state.dateRangeFilter.end ? new Date(state.dateRangeFilter.end) : null;
        
        if (start && itemDate < start) return false;
        if (end && itemDate > end) return false;
        return true;
      });
    }

    return items;
  },

  getItemsByTicket: (ticketId) => {
    return get().mediaItems.filter(item => item.ticketId === ticketId);
  },

  getUnassignedItems: () => {
    return get().mediaItems.filter(item => !item.ticketId);
  },
}));
