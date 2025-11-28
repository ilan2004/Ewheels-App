# Codemagic Setup Guide for EvWheels App

This guide will help you set up Codemagic CI/CD for **fast, local Android builds** of your Expo React Native application.

## Why Local Builds?

✅ **No EAS Queue** - Builds start immediately  
✅ **Faster** - Typically 5-10 minutes vs 20-30+ minutes  
✅ **Cost Effective** - Uses Codemagic minutes (500 free/month) instead of EAS credits  
✅ **Full Control** - Direct Gradle builds on Codemagic infrastructure

## Prerequisites

- Git repository hosted on GitHub, GitLab, or Bitbucket
- Codemagic account (free tier available)
- Android keystore for signing (see [ANDROID_SIGNING_SETUP.md](file:///e:/All%20Softwares/EvWheelsApp/ANDROID_SIGNING_SETUP.md))

## Step 1: Connect Your Repository to Codemagic

1. **Sign up for Codemagic**:
   - Go to [https://codemagic.io](https://codemagic.io)
   - Sign up using your Git provider (GitHub, GitLab, or Bitbucket)

2. **Add Your Application**:
   - Click "Add application"
   - Select your repository provider
   - Choose the `EvWheelsApp` repository
   - Select "Expo React Native" as the project type

3. **Configure Workflow**:
   - Codemagic will detect the `codemagic.yaml` file automatically
   - You should see three workflows: `android-development`, `android-preview`, and `android-production`

## Step 2: Configure Android Signing

**This is the most important step!** Local builds require signing credentials.

## Step 2: Configure Android Signing

**This is the most important step!** Local builds require signing credentials.

Follow the detailed guide: **[ANDROID_SIGNING_SETUP.md](file:///e:/All%20Softwares/EvWheelsApp/ANDROID_SIGNING_SETUP.md)**

### Quick Summary:

1. **Generate or locate your Android keystore** (`.jks` file)
2. **Convert keystore to base64**:
   ```powershell
   # Windows PowerShell
   [Convert]::ToBase64String([IO.File]::ReadAllBytes("your-keystore.jks")) | Set-Clipboard
   ```
3. **Create environment variable group** `android_signing` in Codemagic with:
   - `CM_KEYSTORE` - Base64-encoded keystore (Secure)
   - `CM_KEYSTORE_PASSWORD` - Keystore password (Secure)
   - `CM_KEY_ALIAS` - Key alias (e.g., `evwheels-key`)
   - `CM_KEY_PASSWORD` - Key password (Secure)

4. **Update `android/app/build.gradle`** to use signing config (see full guide)

## Step 3: Update Configuration

Before triggering builds, update the following in `codemagic.yaml`:

### 1. Email Notifications

Replace placeholder emails with your actual addresses:

```yaml
publishing:
  email:
    recipients:
      - your-email@example.com  # Replace with your email
```

### 2. API URLs

Update the API URLs for each environment:

```yaml
environment:
  vars:
    EXPO_PUBLIC_API_URL: https://your-api-url.com  # Replace with actual URL
```

### 3. Slack Integration (Optional)

If you want Slack notifications:

1. Set up a Slack webhook in your workspace
2. Add the webhook URL to Codemagic environment variables
3. Update the channel names in `codemagic.yaml`:

```yaml
publishing:
  slack:
    channel: '#mobile-builds'  # Your Slack channel
```

## Step 4: Trigger Your First Build

### Development Build

Push a commit to the `develop` branch:

```bash
git checkout develop
git commit --allow-empty -m "Test Codemagic build"
git push origin develop
```

### Preview Build

Push a commit to the `main` branch:

```bash
git checkout main
git commit --allow-empty -m "Test Codemagic preview build"
git push origin main
```

### Production Build

Create and push a version tag:

```bash
git tag v1.0.0
git push origin v1.0.0
```

## Step 5: Monitor Build Progress

1. Go to your Codemagic dashboard
2. Click on your app
3. You should see the triggered workflow running
4. Click on the build to view logs in real-time
5. Once complete, download the APK from the artifacts section

## Build Workflow Overview

### Development Workflow (`android-development`)

- **Trigger**: Push to `develop` branch
- **Purpose**: Quick builds for active development
- **Output**: Debug APK
- **Build Method**: Local Gradle build (`assembleDebug`)
- **Build Time**: ~5-10 minutes

### Preview Workflow (`android-preview`)

- **Trigger**: Push to `main` or `release/*` branches, or tags matching `v*-preview`
- **Purpose**: Internal testing and QA
- **Output**: Release APK (signed)
- **Build Method**: Local Gradle build (`assembleRelease`)
- **Build Time**: ~5-10 minutes

### Production Workflow (`android-production`)

- **Trigger**: Tags matching `v*` (e.g., `v1.0.0`, `v2.1.3`)
- **Purpose**: Release builds for Play Store
- **Output**: App Bundle (AAB) for Play Store
- **Build Method**: Local Gradle build (`bundleRelease`)
- **Build Time**: ~10-15 minutes
- **Optional**: Auto-submit to Google Play internal track

## Troubleshooting

### Build Fails with "Keystore file does not exist"

**Solution**: 
1. Verify `CM_KEYSTORE` variable is set correctly in the `android_signing` group
2. Check that the base64 string is complete (no truncation)
3. Ensure the variable is marked as "Secure"

### Build Fails with "Keystore password incorrect"

**Solution**: 
1. Double-check `CM_KEYSTORE_PASSWORD` matches your actual keystore password
2. Verify `CM_KEY_PASSWORD` is correct
3. Check that `CM_KEY_ALIAS` matches the alias in your keystore

### Build Fails with "Gradle task failed"

**Solution**:
1. Check the full build logs in Codemagic
2. Verify `android/app/build.gradle` has the signing configuration
3. Run `npx expo prebuild --platform android --clean` locally to test
4. Ensure Java 17 is being used (specified in workflow)

### APK Won't Install on Device

**Solution**:
1. For debug builds: Ensure you're using the debug APK from `android-development`
2. For release builds: Verify the APK is properly signed
3. Check that the package name matches your app configuration
4. Uninstall any previous versions before installing

### Build is Slow

**Solution**: 
- First build will be slower (~15-20 min) as dependencies are downloaded
- Subsequent builds use caching and should be 5-10 minutes
- Check that caching is enabled in the workflow (it is by default)

### Email Notifications Not Received

**Solution**:
1. Check spam/junk folder
2. Verify email addresses in `codemagic.yaml` are correct
3. Check Codemagic build logs for publishing errors

## Advanced Configuration

### Build Variants

To create different build variants (staging, production, etc.), modify the Gradle build command:

```yaml
- name: Build Staging Release
  script: |
    cd android
    ./gradlew assembleStaging
```

### Version Auto-Increment

The production workflow extracts version from git tags. To use it in your app:

```yaml
- name: Update version in app.json
  script: |
    VERSION=${CM_TAG#v}
    npm version $VERSION --no-git-tag-version
    npx expo prebuild --platform android --clean
```

### Parallel iOS Builds

Create a similar workflow for iOS by duplicating and modifying the Android workflows:

```yaml
ios-production:
  # Similar structure but with iOS-specific commands
  # Use fastlane or xcodebuild for building
```

## Cost Considerations

- **Free Tier**: 500 build minutes/month
- **Development builds**: ~5-10 minutes each (~50-100 builds/month)
- **Preview builds**: ~5-10 minutes each
- **Production builds**: ~10-15 minutes each
- Monitor usage in Codemagic dashboard

## Next Steps

1. ✅ Set up Android signing credentials (see [ANDROID_SIGNING_SETUP.md](file:///e:/All%20Softwares/EvWheelsApp/ANDROID_SIGNING_SETUP.md))
2. ✅ Update email addresses and API URLs in `codemagic.yaml`
3. ✅ Update `android/app/build.gradle` with signing configuration
4. ✅ Trigger a test build
5. ✅ Configure Slack notifications (optional)
6. ✅ Set up Google Play auto-submission (optional)
7. ✅ Create workflows for iOS (optional)

## Resources

- [ANDROID_SIGNING_SETUP.md](file:///e:/All%20Softwares/EvWheelsApp/ANDROID_SIGNING_SETUP.md) - Android signing guide
- [Codemagic Documentation](https://docs.codemagic.io/)
- [Codemagic Android Signing](https://docs.codemagic.io/yaml-code-signing/signing-android/)
- [Expo Prebuild Documentation](https://docs.expo.dev/workflow/prebuild/)
- [Google Play Publishing](https://docs.codemagic.io/yaml-publishing/google-play/)
