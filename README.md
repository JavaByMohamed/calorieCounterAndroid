# calorieCounter - Frontend
This website is for fitness and nutrition people to keep track of their daily calorie intake

## Android quick deploy commands

- `npm run android:live` -> starts a local live server, closes the previous Chrome tab for that localhost session, opens a fresh Chrome tab, then launches Capacitor Android live reload against that same URL.
- `npm run android:phone` -> copy latest web assets, then run on connected Android phone.
- `npm run android:phone:sync` -> sync Capacitor plugins/config, then run on connected Android phone.

### `android:live` defaults

- Live URL: `http://localhost:4173/index.html`
- Chrome auto-open/old-tab cleanup: macOS only
- Android runs with Capacitor live reload + `adb reverse` port forwarding

Optional overrides:

```bash
ANDROID_LIVE_PORT=5005 npm run android:live
ANDROID_LIVE_PAGE=/daily-tracker.html npm run android:live
ANDROID_LIVE_HOST=localhost ANDROID_LIVE_PORT=4173 npm run android:live
```

Helper-only dry run:

```bash
node tools/android-live.js --no-run --no-open
```

## Android release workflow (for daily use)

1. Copy `android/keystore.properties.example` to `android/keystore.properties` and fill in your real keystore values.
2. Build a signed release APK:
   - `npm run android:release:apk`
3. Build a signed release App Bundle (Google Play):
   - `npm run android:release:aab`
4. Before each release, increase `versionCode` and `versionName` in `android/app/build.gradle`.

Notes:
- Keep using the same package id and the same keystore for all future releases.
- Devices with an older release APK will install updates in-place when `versionCode` is higher.

### One-command release + install

- `npm run android:release:ship` -> bumps `versionCode` and `versionName`, copies web assets, builds release APK, and installs with `adb` if a device is connected.
- `npm run android:release:ship:sync` -> same as above but uses Capacitor sync.
- `android:release:ship*` also syncs `currentVersion` in `script/appUpdater.js` and `www/script/appUpdater.js`.

### One-command release + install to emulator/device

- `npm run android:release:install` -> bumps version, builds signed APK, installs to connected `adb` device, launches app.
- `npm run android:release:install:sync` -> same, but uses Capacitor sync.
- `npm run android:release:install:clean` -> same as install, and auto-uninstalls old app if signature mismatch is detected.
- `npm run android:release:install:emu` -> targets `emulator-5554` explicitly.
- `npm run android:release:install:emu:clean` -> same as above, with auto-clean on signature mismatch.

Target a specific device serial directly:

```bash
node tools/release-install.js --device emulator-5554
node tools/release-install.js --device R58Nxxxxxxx --clean-on-mismatch
```

Optional flags:
- `npm run android:release:ship -- --no-install` -> build only.
- `npm run android:release:ship -- --help` -> show script usage.

## In-app APK updater (GitHub Releases / custom server)

The app now includes a **Check Updates** action in the header menu.

### 1) Configure update source

Edit both files:
- `script/appUpdater.js`
- `www/script/appUpdater.js`

Set either:
- `githubOwner` + `githubRepo` (recommended), or
- `manifestUrl` to your own JSON endpoint.

Updater checks use the installed app version from Capacitor (`App.getInfo().version`) when available, and fall back to `currentVersion`.
If you use `npm run android:release:ship` or `npm run android:release:ship:sync`, fallback `currentVersion` is synced automatically.

### 2) Publish a release APK

For GitHub Releases:
- Create a release tag (for example `v1.1`)
- Upload your signed APK asset (`app-release.apk`) to the release

For custom server manifest, return JSON like:

```json
{
  "version": "1.1",
  "apkUrl": "https://example.com/downloads/app-release.apk",
  "releaseNotes": "Bug fixes and performance improvements"
}
```

### 3) User flow

- User taps **Check Updates**
- App compares remote version with `currentVersion`
- If newer APK exists, app prompts and opens download link
- Android still requires user confirmation for install (unknown apps permission)

calorieCounter/
│
├── index.html                // Main landing page
├── bmi-bmr.html              // BMI and BMR calculator page
├── meal.html                 // Add a meal and meal summary page
├── ingredients.html          // Manage ingredients page
├── styles.css                // Shared styles
├── script/
│   ├── mockDatabase.js       // Contains the mock nutrition database
│   ├── ingredientManagement.js // Manages ingredients (add, edit, delete)
│   ├── mealForm.js           // Handles meal form submission and display
│   ├── bmiBmr.js             // Handles BMI and BMR calculations
│   ├── dropdownMenu.js       // Handles the dropdown menu functionality
│   └── main.js               // Initializes the app and imports other scripts

