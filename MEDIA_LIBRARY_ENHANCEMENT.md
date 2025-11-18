# Media Library Modal Enhancement

## Overview
Enhanced the media library modal in `/app/(tabs)/media-library.tsx` to include job card assignment and download functionality when viewing images from the media hub.

## Features Added

### 1. **Assign to Job Card**
- **Button**: Added "Assign to Job Card" button with folder.badge.plus icon
- **Functionality**: Opens a modal to select from available job cards
- **Integration**: Uses the existing `assignToTicket` function from `mediaHubStore`
- **Job Card Selection Modal**:
  - Displays list of recent job cards (50 most recent)
  - Shows ticket number, customer complaint, and customer name
  - Color-coded status indicators
  - Loading state while fetching job cards

### 2. **Download Functionality**
- **Button**: Added "Download" button with arrow.down.circle.fill icon
- **Permission Handling**: Requests media library permissions automatically
- **Image Download**: Saves images directly to device Photos album using `expo-media-library`
- **Other Media**: Saves videos/audio to Downloads folder using `expo-file-system`
- **User Feedback**: Success/error alerts with descriptive messages

### 3. **Enhanced Modal Layout**
- **Primary Actions**: Assign to Job Card and Download (prominent buttons)
- **Secondary Actions**: Share, Delete, and Close (smaller buttons)
- **Responsive Design**: Buttons scale based on content and available space
- **Visual Hierarchy**: Different button colors for different action types:
  - **Assign**: Success green (`Colors.success[600]`)
  - **Download**: Primary blue (`Colors.primary[600]`)
  - **Share**: Warning orange (`Colors.warning[600]`)
  - **Delete**: Danger red (`Colors.danger[600]`)
  - **Close**: Neutral gray (`Colors.neutral[600]`)

## Technical Implementation

### Dependencies Added
```typescript
import * as ExpoMediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import { useMediaHubStore } from '@/stores/mediaHubStore';
import { jobCardsService } from '@/services/jobCardsService';
import { ServiceTicket } from '@/types';
```

### State Management
```typescript
const [jobCardModalVisible, setJobCardModalVisible] = useState(false);
const [availableJobCards, setAvailableJobCards] = useState<ServiceTicket[]>([]);
const [loadingJobCards, setLoadingJobCards] = useState(false);
const [hasMediaLibraryPermissions, setHasMediaLibraryPermissions] = useState(false);
```

### Key Functions
- `requestMediaLibraryPermissions()`: Handles permission requests
- `loadJobCards()`: Fetches available job cards from the service
- `downloadMedia()`: Handles file download based on media type
- `handleAssignToJobCard()`: Opens job card selection modal
- `assignMediaToJobCard()`: Assigns media to selected job card

## User Experience

### Job Card Assignment Flow
1. User clicks "Assign to Job Card" button
2. System loads available job cards
3. Modal displays job card list with details
4. User selects desired job card
5. System assigns media and shows success message
6. Both modals close automatically

### Download Flow
1. User clicks "Download" button
2. System checks for media library permissions
3. If permissions not granted, prompts user to grant them
4. Downloads file to appropriate location (Photos for images, Downloads for others)
5. Shows success message with location details

## Error Handling
- Permission denied scenarios with helpful prompts
- Network errors when loading job cards
- File system errors during download
- Assignment failures with user-friendly messages

## Styling
- Consistent with existing design system
- Proper spacing and visual hierarchy
- Accessible touch targets
- Loading states and empty states
- Status color coding for job cards

## Files Modified
- `/app/(tabs)/media-library.tsx`: Main implementation
- No new files created (used existing services and stores)

## Dependencies Used
- `expo-media-library`: For saving images to Photos
- `expo-file-system`: For saving other media types and file operations
- Existing `mediaHubStore` and `jobCardsService`

## Testing Notes
- App starts successfully with no build errors
- All functionality integrated with existing media store
- Permissions handled gracefully
- Error states properly managed
