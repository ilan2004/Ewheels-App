# Android Signing Setup for Codemagic

This guide explains how to set up Android signing credentials for local builds in Codemagic.

## Why You Need This

Local Gradle builds require a **keystore** to sign your APK/AAB files. Without signing:
- Debug builds won't install on devices
- Release builds can't be uploaded to Play Store
- You'll get build errors

## Step 1: Generate a Keystore (If You Don't Have One)

If you already have a keystore from previous Android development, skip to Step 2.

### Generate New Keystore

Run this command in your terminal:

```bash
keytool -genkeypair -v -storetype JKS -keyalg RSA -keysize 2048 -validity 10000 \
  -alias evwheels-key -keystore evwheels-keystore.jks
```

You'll be prompted for:
- **Keystore password**: Choose a strong password (save it!)
- **Key password**: Can be the same as keystore password
- **Name, Organization, etc.**: Fill in your details

**IMPORTANT**: Save this keystore file and passwords securely! You'll need them for all future builds.

## Step 2: Convert Keystore to Base64

Codemagic requires the keystore as a base64-encoded string.

### On Windows (PowerShell):
```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("evwheels-keystore.jks")) | Set-Clipboard
```

### On macOS/Linux:
```bash
base64 -i evwheels-keystore.jks | pbcopy
```

The base64 string is now in your clipboard.

## Step 3: Configure Environment Variables in Codemagic

1. Go to your Codemagic dashboard
2. Select your app
3. Go to **App settings > Environment variables**
4. Click **Add variable group**
5. Name it: `android_signing`

### Add These Variables:

| Variable Name | Value | Secure? |
|--------------|-------|---------|
| `CM_KEYSTORE` | Paste the base64 string from Step 2 | ✅ Yes |
| `CM_KEYSTORE_PASSWORD` | Your keystore password | ✅ Yes |
| `CM_KEY_ALIAS` | `evwheels-key` (or your alias) | ❌ No |
| `CM_KEY_PASSWORD` | Your key password | ✅ Yes |

## Step 4: Update gradle.properties

The workflow needs to reference these signing credentials. Create or update `android/gradle.properties`:

```properties
# Signing configuration
KEYSTORE_PATH=../keystore.jks
KEYSTORE_PASSWORD=${CM_KEYSTORE_PASSWORD}
KEY_ALIAS=${CM_KEY_ALIAS}
KEY_PASSWORD=${CM_KEY_PASSWORD}
```

## Step 5: Update build.gradle

Update `android/app/build.gradle` to use the signing configuration:

```gradle
android {
    // ... other config

    signingConfigs {
        release {
            if (project.hasProperty('KEYSTORE_PATH')) {
                storeFile file(KEYSTORE_PATH)
                storePassword KEYSTORE_PASSWORD
                keyAlias KEY_ALIAS
                keyPassword KEY_PASSWORD
            }
        }
        debug {
            if (project.hasProperty('KEYSTORE_PATH')) {
                storeFile file(KEYSTORE_PATH)
                storePassword KEYSTORE_PASSWORD
                keyAlias KEY_ALIAS
                keyPassword KEY_PASSWORD
            }
        }
    }

    buildTypes {
        release {
            signingConfig signingConfigs.release
            // ... other release config
        }
        debug {
            signingConfig signingConfigs.debug
            // ... other debug config
        }
    }
}
```

## Step 6: Test Locally (Optional)

Before pushing to Codemagic, test the build locally:

```bash
# Generate android folder
npx expo prebuild --platform android --clean

# Copy your keystore to project root
cp evwheels-keystore.jks ./keystore.jks

# Set environment variables
export CM_KEYSTORE_PASSWORD="your-password"
export CM_KEY_ALIAS="evwheels-key"
export CM_KEY_PASSWORD="your-key-password"

# Build
cd android
./gradlew assembleRelease
```

If successful, you'll find the APK at:
`android/app/build/outputs/apk/release/app-release.apk`

## Troubleshooting

### Error: "Keystore file does not exist"

**Solution**: The base64 decoding failed. Verify:
1. `CM_KEYSTORE` variable contains the full base64 string
2. No extra spaces or newlines in the variable
3. The variable is in the `android_signing` group

### Error: "Keystore password incorrect"

**Solution**: 
1. Double-check `CM_KEYSTORE_PASSWORD` matches your actual password
2. Ensure the variable is marked as "Secure"
3. Try regenerating the keystore if you've forgotten the password

### Error: "Cannot find signing config"

**Solution**: 
1. Verify `android/gradle.properties` exists and has the signing properties
2. Check `android/app/build.gradle` has the `signingConfigs` section
3. Run `npx expo prebuild` to regenerate the android folder

### Build succeeds but APK won't install

**Solution**: 
1. For debug builds, ensure you're using `assembleDebug`
2. For release builds, ensure you're using `assembleRelease`
3. Check that the keystore alias matches what you specified

## Security Best Practices

✅ **DO**:
- Mark all passwords as "Secure" in Codemagic
- Store keystore file in a secure location (password manager, encrypted drive)
- Use different keystores for development and production
- Backup your keystore file

❌ **DON'T**:
- Commit keystore files to git
- Share keystore passwords in plain text
- Use weak passwords
- Lose your production keystore (you can't update apps without it!)

## Next Steps

Once signing is configured:
1. Push to `develop` branch to trigger a development build
2. Check Codemagic dashboard for build progress
3. Download and test the APK
4. If successful, set up preview and production builds

## Resources

- [Android App Signing Documentation](https://developer.android.com/studio/publish/app-signing)
- [Codemagic Code Signing Guide](https://docs.codemagic.io/yaml-code-signing/signing-android/)
- [Expo Prebuild Documentation](https://docs.expo.dev/workflow/prebuild/)
