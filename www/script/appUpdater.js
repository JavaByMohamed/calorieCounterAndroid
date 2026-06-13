(function () {
  const UPDATE_CONFIG = {
    // Option A (recommended): GitHub Releases source.
    githubOwner: "JavaByMohamed",
    githubRepo: "calorieCounterAndroid",

    // Option B: custom JSON endpoint. If set, it is used instead of GitHub.
    // Expected JSON: { "version": "1.0.1", "apkUrl": "https://...apk", "releaseNotes": "..." }
    manifestUrl: "",

    // Keep this in sync with android/app/build.gradle versionName.
    currentVersion: "1.5",

    autoCheckOnLaunch: true,
    autoCheckIntervalHours: 12,
  };

  const LAST_CHECK_KEY = "appUpdaterLastCheckAt";

  function getConfig() {
    const runtimeConfig = window.APP_UPDATER_CONFIG || {};
    return {
      ...UPDATE_CONFIG,
      ...runtimeConfig,
    };
  }

  function normalizeVersion(version) {
    if (!version) return "0.0.0";
    return String(version).trim().replace(/^v/i, "");
  }

  function compareVersions(a, b) {
    const left = normalizeVersion(a).split(".").map((value) => Number.parseInt(value, 10) || 0);
    const right = normalizeVersion(b).split(".").map((value) => Number.parseInt(value, 10) || 0);
    const length = Math.max(left.length, right.length);

    for (let i = 0; i < length; i += 1) {
      const l = left[i] || 0;
      const r = right[i] || 0;
      if (l > r) return 1;
      if (l < r) return -1;
    }

    return 0;
  }

  function getPlatform() {
    if (window.Capacitor && typeof window.Capacitor.getPlatform === "function") {
      return window.Capacitor.getPlatform();
    }

    if (/android/i.test(navigator.userAgent)) {
      return "android";
    }

    return "web";
  }

  function canAutoCheckNow(intervalHours) {
    const last = Number.parseInt(localStorage.getItem(LAST_CHECK_KEY) || "0", 10);
    if (!last) return true;
    return Date.now() - last >= intervalHours * 60 * 60 * 1000;
  }

  function markCheckedNow() {
    localStorage.setItem(LAST_CHECK_KEY, String(Date.now()));
  }

  function mapManifestResponse(data) {
    return {
      version: data.version || data.latestVersion || "",
      apkUrl: data.apkUrl || data.downloadUrl || "",
      releaseNotes: data.releaseNotes || "",
      releasePageUrl: data.releasePageUrl || "",
      source: "manifest",
    };
  }

  function mapGitHubRelease(data) {
    const assets = Array.isArray(data.assets) ? data.assets : [];
    const apkAsset = assets.find((asset) => typeof asset.name === "string" && asset.name.toLowerCase().endsWith(".apk"));

    return {
      version: data.tag_name || data.name || "",
      apkUrl: apkAsset ? apkAsset.browser_download_url : "",
      releaseNotes: data.body || "",
      releasePageUrl: data.html_url || "",
      source: "github",
    };
  }

  async function resolveCurrentVersion(config) {
    const fallback = config.currentVersion || "0.0.0";

    try {
      const App = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App;
      if (!App || typeof App.getInfo !== "function") {
        return fallback;
      }

      const info = await App.getInfo();
      if (info && typeof info.version === "string" && info.version.trim()) {
        return info.version;
      }
    } catch (error) {
      console.warn("[updater] Failed to read runtime app version, using fallback.", error);
    }

    return fallback;
  }

  async function fetchLatestRelease(config) {
    if (config.manifestUrl) {
      const response = await fetch(config.manifestUrl, { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`Manifest request failed (${response.status})`);
      }
      const data = await response.json();
      return mapManifestResponse(data);
    }

    if (!config.githubOwner || !config.githubRepo || config.githubOwner === "YOUR_GITHUB_OWNER" || config.githubRepo === "YOUR_GITHUB_REPO") {
      throw new Error("Configure githubOwner/githubRepo in script/appUpdater.js or window.APP_UPDATER_CONFIG first.");
    }

    const response = await fetch(
      `https://api.github.com/repos/${config.githubOwner}/${config.githubRepo}/releases/latest`,
      {
        headers: { Accept: "application/vnd.github+json" },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      throw new Error(`GitHub release request failed (${response.status})`);
    }

    const data = await response.json();
    return mapGitHubRelease(data);
  }

  async function openDownloadUrl(url) {
    const Browser = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Browser;

    if (Browser && typeof Browser.open === "function") {
      await Browser.open({ url });
      return;
    }

    const opened = window.open(url, "_blank", "noopener");
    if (!opened) {
      window.location.href = url;
    }
  }

  function buildPromptMessage(updateInfo, currentVersion) {
    const notes = (updateInfo.releaseNotes || "").trim().split("\n").slice(0, 5).join("\n");

    const lines = [
      `New version available: ${normalizeVersion(updateInfo.version)}`,
      `Current version: ${normalizeVersion(currentVersion)}`,
      "",
    ];

    if (notes) {
      lines.push("Release notes:");
      lines.push(notes);
      lines.push("");
    }

    lines.push("Download and install now?");
    return lines.join("\n");
  }

  async function checkForUpdates(options) {
    const silent = !!(options && options.silent);
    const config = getConfig();

    if (getPlatform() !== "android") {
      if (!silent) {
        alert("In-app APK updates are only available on Android builds.");
      }
      return { status: "unsupported-platform" };
    }

    try {
      const installedVersion = await resolveCurrentVersion(config);
      const latest = await fetchLatestRelease(config);
      if (!latest.version) {
        throw new Error("Latest version was missing from update source.");
      }

      const isNewer = compareVersions(latest.version, installedVersion) > 0;

      if (!isNewer) {
        if (!silent) {
          alert(`You are up to date (v${normalizeVersion(installedVersion)}).`);
        }
        return { status: "up-to-date", latest };
      }

      const downloadUrl = latest.apkUrl || latest.releasePageUrl;
      if (!downloadUrl) {
        throw new Error("Update source does not provide an APK or release page URL.");
      }

      const shouldInstall = window.confirm(buildPromptMessage(latest, installedVersion));
      if (!shouldInstall) {
        return { status: "cancelled", latest };
      }

      await openDownloadUrl(downloadUrl);
      if (!silent) {
        alert("Download opened. Android will ask you to confirm installation when the APK is ready.");
      }

      return { status: "download-started", latest };
    } catch (error) {
      console.error("[updater] Failed to check updates:", error);
      if (!silent) {
        alert(`Update check failed: ${error.message}`);
      }
      return { status: "error", error };
    }
  }

  function wireButton(button) {
    if (!button || button.dataset.updateInit === "1") return;

    button.dataset.updateInit = "1";
    button.addEventListener("click", async function (event) {
      event.preventDefault();
      await checkForUpdates({ silent: false });
    });
  }

  function initButtons() {
    wireButton(document.getElementById("checkUpdateBtn"));
    wireButton(document.getElementById("mobileCheckUpdateBtn"));
  }

  async function maybeRunAutoCheck() {
    const config = getConfig();
    if (!config.autoCheckOnLaunch) return;
    if (!canAutoCheckNow(config.autoCheckIntervalHours)) return;

    markCheckedNow();
    await checkForUpdates({ silent: true });
  }

  function init() {
    initButtons();
    maybeRunAutoCheck();
  }

  window.AppUpdater = {
    init,
    checkForUpdates,
  };
})();

