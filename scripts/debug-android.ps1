$adb = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"

if (-not (Test-Path $adb)) {
    Write-Error "ADB not found at $adb. Please install Android SDK Platform-Tools."
    exit 1
}

Write-Host "Waiting for device..."
& $adb wait-for-device

Write-Host "Clearing old logs..."
& $adb logcat -c

Write-Host "Listening for logs from com.ilan20.EvWheelsApp..."
Write-Host "Press Ctrl+C to stop."

# Filter for the app's process ID and show logs
# This is a bit complex in pure ADB/PowerShell, so we'll use a simpler approach first:
# Show all logs but highlight/grep for the package name, or just show all Errors/React logs.

# Option 1: Show all React Native logs and Errors
& $adb logcat *:E ReactNative:V ReactNativeJS:V
