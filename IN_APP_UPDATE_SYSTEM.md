# In-App Update System Documentation

## Overview

The Ewheels App now includes a complete in-app update notification system that allows users to receive notifications about new versions and install updates directly from within the app, without needing the Play Store.

## Components

### 1. **UpdateService** (`services/updateService.ts`)
Core service that handles:
- Version checking against a remote JSON file
- APK downloading
- Installation redirection
- Update dismissal tracking
- Notification scheduling

### 2. **UpdateDialog** (`components/ui/UpdateDialog.tsx`)
Professional UI component that displays:
- Update availability notification
- Version number
- Release notes
- Update/Skip/Later actions
- Download progress
- Mandatory update enforcement

### 3. **useUpdateChecker** (`hooks/useUpdateChecker.ts`)
React hook that provides:
- Automatic update checking on app launch
- Background checking when app comes to foreground
- Configurable check intervals
- State management for update flow

## Setup Instructions

### Step 1: Host Version Metadata

You need to host a JSON file that contains information about the latest version. This can be on:
- Your own web server
- GitHub Pages
- Firebase Hosting
- Any CDN

**Example `version.json`:**
```json
{
  "version": "1.0.1",
  "versionCode": 2,
  "releaseDate": "2025-12-19",
  "downloadUrl": "https://your-domain.com/downloads/ewheels-app-v1.0.1.apk",
  "mandatory": false,
  "minSupportedVersion": "1.0.0",
  "releaseNotes": [
    "Fixed battery status tracking issues",
    "Improved job card assignment flow",
    "Enhanced financial reporting accuracy",
    "Performance improvements and bug fixes"
  ]
}
```

### Step 2: Update the Metadata URL

In `services/updateService.ts`, update the URL to point to your hosted version.json:

```typescript
private readonly UPDATE_METADATA_URL = 'https://your-domain.com/ewheels-app/version.json';
```

### Step 3: Integrate into Your App

Add the update checker to your root layout (e.g., `app/_layout.tsx`):

```tsx
import { useUpdateChecker } from '../hooks/useUpdateChecker';
import UpdateDialog from '../components/ui/UpdateDialog';

export default function RootLayout() {
  const {
    updateAvailable,
    latestVersion,
    downloadAndInstall,
    dismissUpdate,
    isDownloading,
  } = useUpdateChecker({
    checkOnMount: true,
    checkOnAppForeground: true,
    checkIntervalHours: 24,
  });

  return (
    <>
      {/* Your existing layout */}
      <Stack>
        {/* ... your screens ... */}
      </Stack>

      {/* Update Dialog */}
      <UpdateDialog
        visible={updateAvailable}
        version={latestVersion}
        onUpdate={downloadAndInstall}
        onDismiss={() => {}}
        onSkip={dismissUpdate}
        isDownloading={isDownloading}
      />
    </>
  );
}
```

### Step 4: Add Manual Check (Optional)

Add a "Check for Updates" button in your settings screen:

```tsx
import { updateService } from '../services/updateService';

function SettingsScreen() {
  const handleCheckUpdates = async () => {
    await updateService.clearDismissedVersion();
    const result = await updateService.checkForUpdates();
    
    if (result.updateAvailable) {
      // Show update dialog
    } else {
      Alert.alert('No Updates', 'You are using the latest version!');
    }
  };

  return (
    <TouchableOpacity onPress={handleCheckUpdates}>
      <Text>Check for Updates</Text>
    </TouchableOpacity>
  );
}
```

## How It Works

### Update Check Flow

1. **On App Launch**: Hook checks if 24 hours have passed since last check
2. **Fetch Metadata**: Downloads version.json from your server
3. **Compare Versions**: Compares `versionCode` (more reliable than version string)
4. **Check Dismissal**: Verifies if user previously dismissed this version
5. **Show Notification**: If update available and not dismissed, shows notification
6. **Display Dialog**: Shows UpdateDialog with release notes

### Download & Install Flow

1. **User Clicks "Update Now"**: Dialog shows downloading state
2. **Download APK**: Service downloads APK to device storage
3. **Open Installer**: Redirects to Android's APK installer
4. **User Installs**: User confirms installation (requires "Install from Unknown Sources")

### Mandatory Updates

If you set `"mandatory": true` in version.json:
- Users cannot dismiss the update
- "Skip" and "Later" buttons are hidden
- Dialog cannot be closed until update is installed

## Version Management Strategy

### Version Numbers
- **version**: Human-readable (e.g., "1.0.1")
- **versionCode**: Integer that increments with each release (e.g., 1, 2, 3...)

### Update `app.json` for Each Release

```json
{
  "expo": {
    "version": "1.0.1",
    "android": {
      "versionCode": 2
    }
  }
}
```

### Update `version.json` on Your Server

After building a new APK:
1. Upload the APK to your download server
2. Update `version.json` with new version info
3. Users will automatically be notified on next check

## User Permissions Required

The app needs these Android permissions (already added to app.json):
- `android.permission.INTERNET` - To download version metadata and APK
- `android.permission.WRITE_EXTERNAL_STORAGE` - To save downloaded APK
- `android.permission.REQUEST_INSTALL_PACKAGES` - To install APK

### User Must Enable "Install from Unknown Sources"

Since the app is not from Play Store, users need to:
1. Go to Settings > Security
2. Enable "Install from Unknown Sources" for your app
3. Or allow when prompted during first update

## Testing

### Test Update Flow Locally

1. Build APK with version 1.0.0
2. Install on device
3. Build APK with version 1.0.1
4. Host both APK and version.json
5. Open app - should show update notification
6. Click "Update Now" - should download and prompt installation

### Test Scenarios

- ✅ Update available, not mandatory
- ✅ Update available, mandatory
- ✅ User dismisses update
- ✅ User clicks "Later"
- ✅ No internet connection
- ✅ Download fails
- ✅ Already on latest version

## Customization

### Change Check Interval

```tsx
useUpdateChecker({
  checkIntervalHours: 12, // Check twice per day
});
```

### Disable Auto-Check

```tsx
useUpdateChecker({
  checkOnMount: false,
  checkOnAppForeground: false,
});
```

### Custom Notification Callback

```tsx
useUpdateChecker({
  onUpdateAvailable: (version) => {
    // Custom logic when update is found
    console.log('New version:', version.version);
    analytics.track('update_available', { version: version.version });
  },
});
```

## Best Practices

1. **Always increment versionCode** - This is the source of truth for updates
2. **Test updates thoroughly** - Bad updates can't be rolled back easily
3. **Use meaningful release notes** - Help users understand what changed
4. **Consider mandatory updates** - For critical security fixes
5. **Monitor update adoption** - Track how many users update
6. **Keep old APKs available** - In case users need to downgrade
7. **Secure your download URL** - Use HTTPS to prevent tampering

## Troubleshooting

### Update Not Showing
- Check if 24 hours have passed since last check
- Verify version.json is accessible
- Check versionCode is higher than current
- Clear dismissed version: `updateService.clearDismissedVersion()`

### Download Fails
- Check internet connection
- Verify downloadUrl is correct and accessible
- Ensure storage permissions are granted

### Installation Fails
- User must enable "Install from Unknown Sources"
- APK must be signed with same keystore
- Check if device has enough storage

## Security Considerations

- Always use HTTPS for version.json and APK downloads
- Sign APKs with the same keystore for all versions
- Consider implementing APK signature verification
- Monitor for man-in-the-middle attacks
- Keep your signing keystore secure

## Future Enhancements

Potential improvements:
- [ ] Delta updates (only download changed parts)
- [ ] Background download with progress notification
- [ ] Automatic installation (requires root or system app)
- [ ] Rollback mechanism
- [ ] A/B testing for updates
- [ ] Update analytics and tracking
