import { supabase } from '@/lib/supabase';
import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';
import { create } from 'zustand';

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
  // Ticket attachment linkage (for Media Hub integration)
  ticketAttachmentId?: string;
  assignedToTicketAt?: string;
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

let searchTimeout: any = null;

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
      console.log('Loading service tickets...');
      const { data, error } = await supabase
        .from('service_tickets')
        .select(`
          *,
          customer:customers(*)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading service tickets:', error);
        throw error;
      }

      console.log(`Loaded ${data?.length} service tickets`);
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
    console.log(`[Assign] Starting assignment for ${mediaIds.length} items to ticket ${ticketId}`);
    try {
      const state = get();
      const itemsToAssign = state.mediaItems.filter(item => mediaIds.includes(item.id));

      if (itemsToAssign.length === 0) {
        throw new Error('No media items found to assign');
      }

      // Check if any items are already assigned (no reassignment allowed)
      const alreadyAssigned = itemsToAssign.filter(item => item.ticketId);
      if (alreadyAssigned.length > 0) {
        throw new Error(`${alreadyAssigned.length} item(s) already assigned to a job card`);
      }

      const assignedAt = new Date().toISOString();
      const createdAttachments: any[] = [];

      // Get session for manual upload
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No authenticated session found');
      }

      for (const id of mediaIds) {
        console.log(`[Assign] Processing item ${id}`);
        // Always fetch the latest item state from the store
        let item = get().mediaItems.find(i => i.id === id);
        if (!item) {
          console.warn(`[Assign] Item ${id} not found in store`);
          continue;
        }

        // 1. Determine target bucket based on media type
        const targetBucket = item.mediaType === 'audio' ? 'media-audio' : 'media-photos';
        const targetFileName = `${item.id}_${item.fileName}`;
        const targetPath = `${item.userId}/${targetFileName}`;

        let tempUri: string | null = null;
        let fileSize = item.fileSize;

        // OPTIMIZATION: Use local file directly if available (skips sync wait)
        if (item.localUri) {
          console.log(`[Assign] Using local file: ${item.localUri}`);
          tempUri = item.localUri;

          // Resolve ph:// URIs (iOS Photo Library) to file:// URIs
          if (tempUri.startsWith('ph://')) {
            const assetId = tempUri.slice(5);
            const assetInfo = await MediaLibrary.getAssetInfoAsync(assetId);
            if (assetInfo?.localUri) {
              tempUri = assetInfo.localUri;
              console.log(`[Assign] Resolved ph:// URI to: ${tempUri}`);
            } else {
              console.warn(`[Assign] Failed to resolve ph:// URI for ${item.fileName}`);
              // Fallback: Try to download if resolution fails
              tempUri = null;
            }
          }
        } else {
          // FALLBACK: Wait for sync and download (for items from other devices)
          if (!item.supabasePath) {
            console.log(`[Assign] Item ${item.id} has no localUri. Waiting for sync...`);

            if (item.syncStatus === 'syncing') {
              // Wait for existing sync to complete
              let retries = 0;
              while (retries < 120) { // Wait up to 60 seconds
                await new Promise(resolve => setTimeout(resolve, 500));
                const freshItem = get().mediaItems.find(i => i.id === id);
                if (freshItem?.supabasePath) {
                  item = freshItem;
                  break;
                }
                if (freshItem?.syncStatus === 'failed') {
                  throw new Error(`Sync failed for ${item.fileName}. Please retry.`);
                }
                retries++;
              }
              if (!item.supabasePath) {
                throw new Error(`Timeout waiting for ${item.fileName} to sync.`);
              }
            } else {
              // Not synced and not syncing, try to upload now
              console.log(`[Assign] Triggering auto-upload for ${item.fileName}...`);
              await get().uploadToSupabase(item);
              item = get().mediaItems.find(i => i.id === id);
            }

            if (!item?.supabasePath) {
              throw new Error(`Item ${item?.fileName} is not synced to cloud yet.`);
            }
          }

          // Download file from media-items bucket to local temp file
          let downloadUrl = item.remoteUrl;
          if (!downloadUrl && item.supabasePath) {
            const { data } = supabase.storage.from(SUPABASE_BUCKET).getPublicUrl(item.supabasePath);
            downloadUrl = data.publicUrl;
          }

          if (!downloadUrl) {
            throw new Error(`Could not determine download URL for ${item.fileName}`);
          }

          const tempDir = FileSystem.cacheDirectory + 'media_assign_temp/';
          await FileSystem.makeDirectoryAsync(tempDir, { intermediates: true });
          tempUri = tempDir + item.fileName;

          console.log(`[Assign] Downloading from ${downloadUrl} to ${tempUri}`);
          const downloadRes = await FileSystem.downloadAsync(downloadUrl, tempUri);
          if (downloadRes.status !== 200) {
            await FileSystem.deleteAsync(tempUri, { idempotent: true });
            throw new Error(`Failed to download ${item.fileName} from ${downloadUrl}`);
          }
        }

        if (!tempUri) {
          throw new Error(`Failed to prepare file for assignment: ${item.fileName}`);
        }

        // 2. Upload to target bucket using FileSystem.uploadAsync for better reliability
        const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
        const uploadUrl = `${supabaseUrl}/storage/v1/object/${targetBucket}/${targetPath}`;

        console.log(`[Assign] Uploading to ${uploadUrl} using FileSystem.uploadAsync`);

        let uploadSuccess = false;
        let lastError;

        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            console.log(`[Assign] Upload attempt ${attempt + 1}/3`);

            const uploadResult = await FileSystem.uploadAsync(uploadUrl, tempUri, {
              fieldName: 'file',
              httpMethod: 'POST',
              uploadType: 1, // FileSystem.FileSystemUploadType.MULTIPART
              headers: {
                'apikey': process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
                'Authorization': `Bearer ${session.access_token}`,
              },
              mimeType: item.metadata?.mimeType || (item.mediaType === 'audio' ? 'audio/m4a' : 'image/jpeg'),
            });

            if (uploadResult.status !== 200) {
              throw new Error(`Status: ${uploadResult.status} ${uploadResult.body}`);
            }

            uploadSuccess = true;
            console.log(`[Assign] Upload success`);
            break;
          } catch (err) {
            lastError = err;
            console.warn(`[Assign] Upload attempt ${attempt + 1} failed:`, err);
            await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1))); // Backoff
          }
        }

        if (!uploadSuccess) {
          // Cleanup temp file if we downloaded it
          if (!item.localUri && tempUri) {
            await FileSystem.deleteAsync(tempUri, { idempotent: true });
          }
          throw new Error(`Failed to upload to ${targetBucket} after 3 attempts: ${lastError}`);
        }

        // Get file size if missing
        if (!fileSize) {
          const fileInfo = await FileSystem.getInfoAsync(tempUri);
          if (fileInfo.exists) {
            fileSize = fileInfo.size;
          }
        }

        // Cleanup temp file ONLY if we downloaded it
        if (!item.localUri && tempUri) {
          await FileSystem.deleteAsync(tempUri, { idempotent: true });
        }

        // 3. Create ticket_attachments record
        console.log(`[Assign] Creating attachment record in DB`);
        const { data: attachment, error: attachError } = await supabase
          .from('ticket_attachments')
          .insert({
            ticket_id: ticketId,
            file_name: targetFileName,
            original_name: item.fileName,
            storage_path: targetPath,
            file_size: fileSize || 0,
            mime_type: item.metadata?.mimeType ||
              (item.mediaType === 'audio' ? 'audio/m4a' : 'image/jpeg'),
            attachment_type: item.mediaType === 'audio' ? 'audio' : 'photo',
            duration: item.durationSeconds,
            uploaded_by: item.userId,
            uploaded_at: assignedAt,
            processed: true,
            source: 'media_hub'
          })
          .select()
          .single();

        if (attachError) {
          console.error('[Assign] Failed to create ticket_attachments record:', attachError);
          // Clean up uploaded file if attachment creation fails
          await supabase.storage.from(targetBucket).remove([targetPath]);
          throw new Error(`Failed to create attachment record for ${item.fileName}`);
        }

        createdAttachments.push(attachment);

        // 4. Update media_items with ticket_attachment_id link
        console.log(`[Assign] Updating media_items record`);
        const { error: updateError } = await supabase
          .from('media_items')
          .update({
            ticket_id: ticketId,
            ticket_attachment_id: attachment.id,
            assigned_at: assignedAt,
            assigned_to_ticket_at: assignedAt,
            updated_at: assignedAt
          })
          .eq('id', item.id);

        if (updateError) {
          console.error('[Assign] Failed to update media_items:', updateError);
        }
      }

      // 5. Update local state
      console.log(`[Assign] Updating local state`);
      set((state) => {
        const updatedItems = state.mediaItems.map(item => {
          if (!mediaIds.includes(item.id)) return item;

          const attachment = createdAttachments.find(a =>
            a.original_name === item.fileName
          );

          return {
            ...item,
            ticketId,
            assignedAt,
            updatedAt: assignedAt,
            ticketAttachmentId: attachment?.id,
            assignedToTicketAt: assignedAt
          };
        });

        return {
          mediaItems: updatedItems,
          filteredItems: state.filteredItems.map(item => {
            if (!mediaIds.includes(item.id)) return item;

            const attachment = createdAttachments.find(a =>
              a.original_name === item.fileName
            );

            return {
              ...item,
              ticketId,
              assignedAt,
              updatedAt: assignedAt,
              ticketAttachmentId: attachment?.id,
              assignedToTicketAt: assignedAt
            };
          }),
          selectedItems: []
        };
      });

      console.log(`[Assign] Successfully assigned ${createdAttachments.length} media items to ticket ${ticketId}`);

      // 6. Trigger background sync for local items AFTER assignment is complete
      // This prevents bandwidth contention during the critical assignment phase
      for (const id of mediaIds) {
        const item = get().mediaItems.find(i => i.id === id);
        if (item?.localUri && !item.supabasePath && item.syncStatus !== 'syncing') {
          console.log(`[Assign] Triggering deferred background sync for ${item.fileName}...`);
          get().uploadToSupabase(item).catch(err =>
            console.warn('[Assign] Background sync failed (post-assignment):', err)
          );
        }
      }

    } catch (error) {
      console.error('[Assign] Error:', error);
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
            ? {
              ...item,
              ticketId: ticketId || undefined,
              assignedAt: assignedAt || undefined,
              updatedAt: new Date().toISOString()
            }
            : item
        );

        return {
          mediaItems: updatedItems,
          filteredItems: state.filteredItems.map(item =>
            itemIds.includes(item.id)
              ? {
                ...item,
                ticketId: ticketId || undefined,
                assignedAt: assignedAt || undefined,
                updatedAt: new Date().toISOString()
              }
              : item
          ),
          selectedItems: []
        };
      });
    } catch (error) {
      console.error('[Assign] Error assigning to ticket:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to assign media to ticket');
    }
  },

  uploadToSupabase: async (item) => {
    if (!item.localUri) {
      console.warn(`Skipping upload for ${item.fileName}: no localUri`);
      return;
    }

    set((state) => ({
      mediaItems: state.mediaItems.map(i =>
        i.id === item.id
          ? { ...i, syncStatus: 'syncing', uploadProgress: 0 }
          : i
      )
    }));

    try {
      // Get current session for authentication
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No authenticated session found');
      }

      const fileExtension = item.fileName.split('.').pop();
      const targetFileName = `${item.id}_${fileExtension}`; // Use item.id for unique file name
      const supabasePath = `${item.userId}/${targetFileName}`;

      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

      const uploadUrl = `${supabaseUrl}/storage/v1/object/${SUPABASE_BUCKET}/${supabasePath}`;

      console.log(`Uploading ${item.fileName} to ${uploadUrl} with auth token...`);

      // Resolve ph:// URIs (iOS Photo Library) to file:// URIs
      let uploadUri = item.localUri;
      if (uploadUri.startsWith('ph://')) {
        const assetId = uploadUri.slice(5);
        const assetInfo = await MediaLibrary.getAssetInfoAsync(assetId);
        if (assetInfo?.localUri) {
          uploadUri = assetInfo.localUri;
          console.log(`[Sync] Resolved ph:// URI to: ${uploadUri}`);
        } else {
          console.warn(`[Sync] Failed to resolve ph:// URI for ${item.fileName}`);
          throw new Error(`Failed to resolve ph:// URI for ${item.fileName}`);
        }
      }

      let uploadSuccess = false;
      let lastError;

      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const uploadResult = await FileSystem.uploadAsync(uploadUrl, uploadUri, {
            fieldName: 'file',
            httpMethod: 'POST',
            uploadType: 1, // FileSystem.FileSystemUploadType.MULTIPART
            headers: {
              'apikey': supabaseKey!,
              'Authorization': `Bearer ${session.access_token}`,
            },
            mimeType: item.mediaType === 'image' ? 'image/jpeg' :
              item.mediaType === 'video' ? 'video/mp4' : 'audio/m4a',
          });

          if (uploadResult.status !== 200) {
            throw new Error(`Status: ${uploadResult.status} ${uploadResult.body}`);
          }

          uploadSuccess = true;
          console.log(`Upload successful for ${item.fileName} (Attempt ${attempt + 1})`);
          break;
        } catch (fetchError: any) {
          lastError = fetchError;
          console.warn(`Upload failed for ${item.fileName} (Attempt ${attempt + 1}):`, fetchError);
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        }
      }

      if (!uploadSuccess) {
        throw new Error(`Upload failed after 3 attempts: ${lastError?.message || 'Unknown error'}`);
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

      console.log(`${item.fileName} marked as synced`);

    } catch (error) {
      console.error('Upload error:', error);
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

