# Resume Builder - Development & Fix Log

This log tracks key problems faced during development and the solutions implemented to fix them.

---

## 1. PDF Export: From Sharing to Direct Open
- **Problem**: Using `expo-sharing` showed a generic system share popup, requiring the user to manually select an app just to view their resume.
- **Goal**: Direct download and automatic "Open With" behavior.
- **Solution**: 
    - Integrated `expo-intent-launcher` for Android.
    - Implemented `FileSystem.copyAsync` to move the temporary PDF to a permanent `documentDirectory`.
    - Used `FileSystem.getContentUriAsync` to generate a URI that external PDF viewers can read.
    - Added `IntentLauncher.startActivityAsync` with `android.intent.action.VIEW` to trigger the default PDF viewer automatically.

## 2. Native Module Missing (IntentLauncher)
- **Problem**: App crashed with `[Error: Cannot find native module 'ExpoIntentLauncher']` during development.
- **Cause**: `expo-intent-launcher` requires a native rebuild (prebuild) which wasn't performed yet.
- **Solution**: Wrapped the `IntentLauncher` call in a `try-catch` block. It now gracefully falls back to the standard `Sharing` dialog if the native module is missing, preventing crashes during the development phase.

## 3. Expo 54 FileSystem Deprecation
- **Problem**: `[Error: Method copyAsync imported from "expo-file-system" is deprecated.]`
- **Cause**: Expo 54 (April 2026) moved legacy methods to a separate entry point.
- **Solution**: Updated imports to `import * as FileSystem from 'expo-file-system/legacy'`.

## 4. Resume Preview Alignment & Zoom
- **Problem**: The resume preview in the app was either too zoomed in, touching the edges, or not centered.
- **Fixes**:
    - **Centering**: Added a `#center-wrapper` with Flexbox centering.
    - **Scaling Math**: Implemented `Math.min(scaleW, scaleH)` to ensure the entire A4 page is visible (Canva-style zoom-out).
    - **Margins**: Added generous safety offsets (`winW - 120`, `winH - 150`) to ensure 4-side spacing.
    - **Precision**: Used `transform: translate(-50%, -50%)` to ensure mathematical horizontal and vertical centering.

## 5. PDF Export Gaps
- **Problem**: The gaps used for the "Studio" preview were appearing in the final PDF, causing white space around the resume.
- **Solution**: Created a dedicated `printStyles` block in `resume-html-generator.ts`. It locks the width to exactly `595pt` and removes all preview-specific margins/wrappers during the `isPrint` phase.

---
*Last Updated: April 2026*
