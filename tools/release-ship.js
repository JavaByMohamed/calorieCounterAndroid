#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { spawnSync, spawn } = require("child_process");

const projectRoot = path.resolve(__dirname, "..");
const androidRoot = path.join(projectRoot, "android");
const appGradlePath = path.join(projectRoot, "android", "app", "build.gradle");
const localPropertiesPath = path.join(androidRoot, "local.properties");
const updaterConfigPaths = [
  path.join(projectRoot, "script", "appUpdater.js"),
  path.join(projectRoot, "www", "script", "appUpdater.js"),
];
const updaterSourcePath = path.join(projectRoot, "www", "script", "appUpdater.js");
const releaseApkPath = path.join(
  projectRoot,
  "android",
  "app",
  "build",
  "outputs",
  "apk",
  "release",
  "app-release.apk"
);

const args = process.argv.slice(2);
const shouldSync = args.includes("--sync");
const skipInstall = args.includes("--no-install");
const showHelp = args.includes("--help") || args.includes("-h");

if (showHelp) {
  console.log("Usage: node tools/release-ship.js [--sync] [--no-install]");
  console.log("  --sync       Use 'npx cap sync android' instead of 'npx cap copy android'.");
  console.log("  --no-install Build only, do not attempt adb install.");
  process.exit(0);
}

function run(command, commandArgs, options = {}) {
  const result = spawnSync(command, commandArgs, {
    cwd: options.cwd || projectRoot,
    stdio: options.captureOutput ? "pipe" : "inherit",
    shell: false,
    encoding: "utf8",
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0 && !options.allowFailure) {
    throw new Error(`${command} ${commandArgs.join(" ")} failed with exit code ${result.status}`);
  }

  return result;
}

function parseLocalSdkDir() {
  if (!fs.existsSync(localPropertiesPath)) {
    return "";
  }

  const content = fs.readFileSync(localPropertiesPath, "utf8");
  const match = content.match(/^sdk\.dir=(.+)$/m);
  if (!match) {
    return "";
  }

  return match[1]
    .trim()
    .replace(/\\:/g, ":")
    .replace(/\\ /g, " ");
}

function resolveAaptPath() {
  const candidates = [];

  if (process.env.ANDROID_SDK_ROOT) {
    candidates.push(path.join(process.env.ANDROID_SDK_ROOT, "build-tools"));
  }

  if (process.env.ANDROID_HOME) {
    candidates.push(path.join(process.env.ANDROID_HOME, "build-tools"));
  }

  const localSdkDir = parseLocalSdkDir();
  if (localSdkDir) {
    candidates.push(path.join(localSdkDir, "build-tools"));
  }

  for (const buildToolsRoot of candidates) {
    if (!buildToolsRoot || !fs.existsSync(buildToolsRoot)) continue;
    const versions = fs.readdirSync(buildToolsRoot).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    for (let i = versions.length - 1; i >= 0; i -= 1) {
      const aaptPath = path.join(buildToolsRoot, versions[i], "aapt");
      if (fs.existsSync(aaptPath)) {
        return aaptPath;
      }
    }
  }

  return "aapt";
}

function readApkVersion() {
  const aaptPath = resolveAaptPath();
  const result = run(aaptPath, ["dump", "badging", releaseApkPath], {
    captureOutput: true,
    allowFailure: true,
  });

  if (result.status !== 0) {
    const output = `${result.stdout || ""}${result.stderr || ""}`.trim();
    throw new Error(`Failed to inspect APK with '${aaptPath}'. ${output || "Install Android build-tools or add aapt to PATH."}`);
  }

  const output = `${result.stdout || ""}${result.stderr || ""}`;
  const versionCodeMatch = output.match(/versionCode='(\d+)'/);
  const versionNameMatch = output.match(/versionName='([^']+)'/);

  if (!versionCodeMatch || !versionNameMatch) {
    throw new Error("Could not parse versionCode/versionName from built APK.");
  }

  return {
    versionCode: Number(versionCodeMatch[1]),
    versionName: versionNameMatch[1],
    aaptPath,
  };
}

function assertBuiltApkVersion(expected) {
  const actual = readApkVersion();
  if (actual.versionCode !== expected.newCode || actual.versionName !== expected.newName) {
    throw new Error(
      [
        "Built APK version mismatch.",
        `Expected versionCode=${expected.newCode}, versionName=${expected.newName}`,
        `Actual   versionCode=${actual.versionCode}, versionName=${actual.versionName}`,
      ].join(" ")
    );
  }

  console.log(`[release] Verified APK metadata with ${actual.aaptPath}`);
  console.log(`[release] APK versionCode/versionName -> ${actual.versionCode}/${actual.versionName}`);
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function extractAssetFromApk(assetPathInApk) {
  const unzipResult = run("unzip", ["-p", releaseApkPath, assetPathInApk], {
    captureOutput: true,
    allowFailure: true,
  });

  if (unzipResult.status !== 0) {
    const output = `${unzipResult.stdout || ""}${unzipResult.stderr || ""}`.trim();
    throw new Error(`Failed to read '${assetPathInApk}' from APK. ${output}`);
  }

  return unzipResult.stdout || "";
}

function assertBundledUpdaterAssetFresh() {
  if (!fs.existsSync(updaterSourcePath)) {
    throw new Error(`Updater source file not found: ${updaterSourcePath}`);
  }

  const localSource = fs.readFileSync(updaterSourcePath, "utf8");
  const bundledSource = extractAssetFromApk("assets/public/script/appUpdater.js");

  const localHash = sha256(localSource);
  const bundledHash = sha256(bundledSource);

  if (localHash !== bundledHash) {
    throw new Error(
      [
        "Bundled appUpdater.js is stale.",
        "APK content does not match local www/script/appUpdater.js.",
        "Run 'npx cap copy android' (or --sync) and rebuild.",
      ].join(" ")
    );
  }

  console.log("[release] Verified bundled assets/public/script/appUpdater.js matches local www/script/appUpdater.js");
}

function bumpVersionName(versionName) {
  const parts = versionName.split(".");
  const last = Number(parts[parts.length - 1]);

  if (Number.isNaN(last)) {
    return versionName;
  }

  parts[parts.length - 1] = String(last + 1);
  return parts.join(".");
}

function bumpAndroidVersion() {
  const gradle = fs.readFileSync(appGradlePath, "utf8");

  const codeMatch = gradle.match(/versionCode\s+(\d+)/);
  const nameMatch = gradle.match(/versionName\s+"([^"]+)"/);

  if (!codeMatch || !nameMatch) {
    throw new Error("Could not find versionCode/versionName in android/app/build.gradle");
  }

  const oldCode = Number(codeMatch[1]);
  const newCode = oldCode + 1;

  const oldName = nameMatch[1];
  const newName = bumpVersionName(oldName);

  const updated = gradle
    .replace(/versionCode\s+\d+/, `versionCode ${newCode}`)
    .replace(/versionName\s+"[^"]+"/, `versionName "${newName}"`);

  fs.writeFileSync(appGradlePath, updated, "utf8");

  console.log(`[release] versionCode: ${oldCode} -> ${newCode}`);
  console.log(`[release] versionName: ${oldName} -> ${newName}`);

  return { newCode, newName };
}

function syncUpdaterCurrentVersion(newVersionName) {
  for (const filePath of updaterConfigPaths) {
    if (!fs.existsSync(filePath)) {
      console.log(`[release] Updater config not found, skipped: ${path.relative(projectRoot, filePath)}`);
      continue;
    }

    const content = fs.readFileSync(filePath, "utf8");
    const updated = content.replace(/currentVersion:\s*"[^"]+"/, `currentVersion: "${newVersionName}"`);

    if (content === updated) {
      console.log(`[release] currentVersion entry not found in ${path.relative(projectRoot, filePath)}; skipped.`);
      continue;
    }

    fs.writeFileSync(filePath, updated, "utf8");
    console.log(`[release] Synced updater version in ${path.relative(projectRoot, filePath)} -> ${newVersionName}`);
  }
}

function tryInstallReleaseApk() {
   if (!fs.existsSync(releaseApkPath)) {
     console.log(`[release] APK not found at ${releaseApkPath}; skipping install.`);
     return;
   }

   const adbCheck = run("adb", ["get-state"], { allowFailure: true });
   if (adbCheck.status !== 0) {
     console.log("[release] No adb device detected; build completed, install skipped.");
     return;
   }

   console.log("[release] Installing release APK on connected device...");
   run("adb", ["install", "-r", releaseApkPath]);
}

function commitAndTagRelease(versionName) {
   try {
     // Check if there are changes to commit
     const statusResult = run("git", ["status", "--short"], { captureOutput: true });
     const hasChanges = (statusResult.stdout || "").trim().length > 0;

     if (!hasChanges) {
       console.log("[release] No changes to commit.");
       return;
     }

     console.log(`[release] Committing version bump to ${versionName}...`);
     run("git", ["add", "android/app/build.gradle", "script/appUpdater.js", "www/script/appUpdater.js"]);
     run("git", ["commit", "-m", `Release v${versionName}`]);

     console.log(`[release] Creating and pushing git tag v${versionName}...`);
     run("git", ["tag", "-a", `v${versionName}`, "-m", `Release version ${versionName}`]);
     run("git", ["push", "origin", "main"]);
     run("git", ["push", "origin", `v${versionName}`]);

     console.log(`[release] Version committed and tagged. Next: create GitHub release with APK upload.`);
     console.log(`[release]   - Go to: https://github.com/JavaByMohamed/calorieCounterAndroid/releases/new`);
     console.log(`[release]   - Tag: v${versionName}`);
     console.log(`[release]   - Upload: ${path.relative(projectRoot, releaseApkPath)}`);
   } catch (error) {
     console.warn(`[release] Git operations failed (likely not a git repo, or push requires auth): ${error.message}`);
   }
}

try {
   const bumpedVersion = bumpAndroidVersion();
   const { newName } = bumpedVersion;
   syncUpdaterCurrentVersion(newName);

   if (shouldSync) {
     console.log("[release] Running: npx cap sync android");
     run("npx", ["cap", "sync", "android"]);
   } else {
     console.log("[release] Running: npx cap copy android");
     run("npx", ["cap", "copy", "android"]);
   }

   console.log("[release] Building signed release APK...");
   run("./gradlew", ["assembleRelease"], { cwd: path.join(projectRoot, "android") });

   assertBuiltApkVersion(bumpedVersion);
   assertBundledUpdaterAssetFresh();

   // Commit version changes and create git tag
   commitAndTagRelease(newName);

   if (!skipInstall) {
     tryInstallReleaseApk();
   }

   console.log("[release] Done.");
} catch (error) {
   console.error(`[release] Failed: ${error.message}`);
   process.exit(1);
}

