#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const projectRoot = path.resolve(__dirname, "..");
const appGradlePath = path.join(projectRoot, "android", "app", "build.gradle");
const updaterConfigPaths = [
  path.join(projectRoot, "script", "appUpdater.js"),
  path.join(projectRoot, "www", "script", "appUpdater.js"),
];
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
    stdio: "inherit",
    shell: false,
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0 && !options.allowFailure) {
    throw new Error(`${command} ${commandArgs.join(" ")} failed with exit code ${result.status}`);
  }

  return result;
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

try {
  const { newName } = bumpAndroidVersion();
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

  if (!skipInstall) {
    tryInstallReleaseApk();
  }

  console.log("[release] Done.");
} catch (error) {
  console.error(`[release] Failed: ${error.message}`);
  process.exit(1);
}

