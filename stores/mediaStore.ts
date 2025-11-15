import { create } from 'zustand';
import { File, Directory, Paths } from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';

export interface MediaItem {
  id: string;
  name: string;
  uri: string;
  type: 'image' | 'video' | 'audio';
  size: number;
  createdAt: string;
  ticketId?: string;
  thumbnail?: string;
}

interface MediaStore {
  recordings: MediaItem[];
  photos: MediaItem[];
  videos: MediaItem[];
  loading: boolean;
  refreshRecordings: () => Promise<void>;
  addRecording: (recording: MediaItem) => void;
  removeRecording: (id: string) => void;
  getAllMedia: () => MediaItem[];
}

export const useMediaStore = create<MediaStore>((set, get) => ({
  recordings: [],
  photos: [],
  videos: [],
  loading: false,

  refreshRecordings: async () => {
    try {
      set({ loading: true });
      
      const recordingsDir = new Directory(Paths.document, 'recordings');
      
      if (recordingsDir.exists) {
        const files = recordingsDir.list();
        const audioFiles = files.filter(item => item instanceof File && item.name.endsWith('.m4a'));
        
        const recordingsList: MediaItem[] = [];
        for (const file of audioFiles) {
          if (file instanceof File) {
            const fileInfo = file.info();
            
            recordingsList.push({
              id: file.name.replace('.m4a', ''),
              name: file.name.replace('.m4a', '').replace(/_/g, ' '),
              uri: file.uri,
              type: 'audio',
              size: fileInfo.size || 0,
              createdAt: new Date(fileInfo.modificationTime! * 1000).toISOString(),
              ticketId: 'Generated', // You can implement ticket association later
            });
          }
        }
        
        recordingsList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        set({ recordings: recordingsList, loading: false });
      } else {
        set({ recordings: [], loading: false });
      }
    } catch (error) {
      console.error('Error loading recordings:', error);
      set({ loading: false });
    }
  },

  addRecording: (recording) => {
    set(state => ({
      recordings: [recording, ...state.recordings]
    }));
  },

  removeRecording: (id) => {
    set(state => ({
      recordings: state.recordings.filter(r => r.id !== id)
    }));
  },

  getAllMedia: () => {
    const state = get();
    return [
      ...state.recordings,
      ...state.photos,
      ...state.videos,
      // Add some mock data for demonstration
      {
        id: 'mock-1',
        name: 'Battery Inspection 001',
        uri: 'https://picsum.photos/300/300?random=1',
        type: 'image' as const,
        size: 2400000,
        createdAt: new Date('2024-11-09T10:30:00').toISOString(),
        ticketId: 'TK-001',
        thumbnail: 'https://picsum.photos/150/150?random=1',
      },
      {
        id: 'mock-2',
        name: 'Vehicle Demo 002',
        uri: 'https://sample-videos.com/zip/10/mp4/SampleVideo_360x240_1mb.mp4',
        type: 'video' as const,
        size: 15200000,
        createdAt: new Date('2024-11-09T09:15:00').toISOString(),
        ticketId: 'TK-002',
        thumbnail: 'https://picsum.photos/150/150?random=2',
      },
      {
        id: 'mock-3',
        name: 'Damage Report 003',
        uri: 'https://picsum.photos/300/300?random=3',
        type: 'image' as const,
        size: 3100000,
        createdAt: new Date('2024-11-09T08:45:00').toISOString(),
        ticketId: 'TK-003',
        thumbnail: 'https://picsum.photos/150/150?random=3',
      },
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },
}));
