# Strumet Android launcher

This small Android app adds a searchable **Strumet** icon to the phone. It opens the current private Strumet URL in Chrome, so Firebase sign-in and microphone support remain in Chrome. The phone must be connected to Tailscale, and the Mac must be running Strumet.

Build on macOS with Android SDK 36, Java, and an Android debug keystore:

```bash
bash scripts/build-android-launcher.sh
adb install -r public/download/Strumet-Android.apk
```

The APK is signed with the local Android debug key and is intended for private distribution, not Play Store publication. After building, run `npm run build` and restart the local server to make `/download/Strumet-Android.apk` available through Tailscale Serve. Recipients need a Tailscale share of the Mac before they can download or use it. To change the private URL, edit `MainActivity.java` and rebuild.
