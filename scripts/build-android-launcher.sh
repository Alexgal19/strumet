#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SDK_DIR="${ANDROID_HOME:-$HOME/Library/Android/sdk}"
BUILD_TOOLS="$SDK_DIR/build-tools/36.0.0"
ANDROID_JAR="$SDK_DIR/platforms/android-36/android.jar"
KEYSTORE="${ANDROID_DEBUG_KEYSTORE:-$HOME/.android/debug.keystore}"
WORK_DIR="$PROJECT_DIR/.local-voice/android-launcher-build"
OUTPUT_APK="${1:-$PROJECT_DIR/public/download/Strumet-Android.apk}"

for tool in aapt d8 zipalign apksigner; do
  [[ -x "$BUILD_TOOLS/$tool" ]] || { echo "Brakuje $BUILD_TOOLS/$tool" >&2; exit 1; }
done
[[ -f "$ANDROID_JAR" ]] || { echo "Brakuje Android SDK 36" >&2; exit 1; }
[[ -f "$KEYSTORE" ]] || { echo "Brakuje klucza debug: $KEYSTORE" >&2; exit 1; }

mkdir -p "$WORK_DIR/classes" "$WORK_DIR/dex" "$WORK_DIR/res/drawable-nodpi" "$(dirname "$OUTPUT_APK")"
cp "$PROJECT_DIR/public/icon/icon-192x192.png" "$WORK_DIR/res/drawable-nodpi/icon.png"

javac --release 8 -cp "$ANDROID_JAR" -d "$WORK_DIR/classes" \
  "$PROJECT_DIR/android-launcher/src/pl/strumet/launcher/MainActivity.java"
"$BUILD_TOOLS/d8" --min-api 26 --lib "$ANDROID_JAR" --output "$WORK_DIR/dex" \
  "$WORK_DIR/classes/pl/strumet/launcher/MainActivity.class"
"$BUILD_TOOLS/aapt" package -f -M "$PROJECT_DIR/android-launcher/AndroidManifest.xml" \
  -S "$WORK_DIR/res" -I "$ANDROID_JAR" -F "$WORK_DIR/unsigned.apk"
(
  cd "$WORK_DIR/dex"
  "$BUILD_TOOLS/aapt" add "$WORK_DIR/unsigned.apk" classes.dex
)
"$BUILD_TOOLS/zipalign" -f 4 "$WORK_DIR/unsigned.apk" "$WORK_DIR/aligned.apk"
"$BUILD_TOOLS/apksigner" sign --ks "$KEYSTORE" --ks-key-alias androiddebugkey \
  --ks-pass pass:android --key-pass pass:android --out "$OUTPUT_APK" "$WORK_DIR/aligned.apk"
"$BUILD_TOOLS/apksigner" verify "$OUTPUT_APK"
echo "$OUTPUT_APK"
