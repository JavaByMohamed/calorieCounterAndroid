#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const projectRoot = path.resolve(__dirname, "..");
const androidRoot = path.join(projectRoot, "android");
const localPropertiesPath = path.join(androidRoot, "local.properties");
const releaseApkPath = path.join(
  androidRoot,
  "app",
  "build",
  "outputs",
  "apk",
  "release",
  "app-release.apk"
);

const args = process.argv.slice(2);
const shouldSync = args.includes("--sync");
const cleanOnMismatch = args.includes("--clean-on-mismatch");
const showHelp = args.includes("--help") || args.includes("-h");

function readFlagValue(flagName) {
  const inline = args.find((arg) => arg.startsWith(`${flagName}=`));
  if (inline) {
    return inline.slice(flagName.length + 1).trim();
  }

  const index = args.indexOf(flagName);
  if (index === -1) {
    return "";
  }

  const next = args[index + 1];
  if (!next || next.startsWith("--")) {
    return "";
  }

  return next.trim();
}

const targetDevice = readFlagValue("--device");

if (args.includes("--device") && !targetDevice) {
  console.error("[release-install] --device requires a serial value.");
  process.exit(1);
}

if (showHelp) {
  console.log("Usage: node tools/release-install.js [--sync] [--clean-on-mismatch] [--device SERIAL]");
  console.log("  --sync                Use Capacitor sync before build.");
  console.log("  --clean-on-mismatch   Uninstall app and retry install if signature mismatch occurs.");
  console.log("  --device SERIAL       Target a specific adb device/emulator serial.");
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

  // Gradle local.properties escapes ':' as '\:' and spaces as '\ '
  return match[1]
    .trim()
    .replace(/\\:/g, ":")
    .replace(/\\ /g, " ");
}

function resolveAdbPath() {
  const candidates = [];

  if (process.env.ANDROID_SDK_ROOT) {
    candidates.push(path.join(process.env.ANDROID_SDK_ROOT, "platform-tools", "adb"));
  }

  if (process.env.ANDROID_HOME) {
    candidates.push(path.join(process.env.ANDROID_HOME, "platform-tools", "adb"));
  }

  const localSdkDir = parseLocalSdkDir();
  if (localSdkDir) {
    candidates.push(path.join(localSdkDir, "platform-tools", "adb"));
  }

  for (const candidate of candidates) {
    if (candidate && fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return "adb";
}

function toDeviceArgs(serial, commandArgs) {
  if (!serial) {
    return commandArgs;
  }

  return ["-s", serial, ...commandArgs];
}

function installApk(adbPath, serial) {
  const install = run(adbPath, toDeviceArgs(serial, ["install", "-r", releaseApkPath]), {
    allowFailure: true,
    captureOutput: true,
  });

  const output = `${install.stdout || ""}${install.stderr || ""}`;
  if (install.status === 0) {
    process.stdout.write(output);
    return;
  }

  if (output.includes("INSTALL_FAILED_UPDATE_INCOMPATIBLE") && cleanOnMismatch) {
    console.log("[release-install] Signature mismatch detected. Uninstalling old app and retrying...");
    run(adbPath, toDeviceArgs(serial, ["uninstall", "com.android.caloriecounter"]), { allowFailure: true });
    run(adbPath, toDeviceArgs(serial, ["install", releaseApkPath]));
    return;
  }

  process.stdout.write(output);
  throw new Error("APK install failed. Use --clean-on-mismatch to auto-uninstall on signature mismatch.");
}

try {
  const shipArgs = ["tools/release-ship.js", "--no-install"];
  if (shouldSync) {
    shipArgs.push("--sync");
  }

  console.log("[release-install] Building signed release APK...");
  run("node", shipArgs);

  if (!fs.existsSync(releaseApkPath)) {
    throw new Error(`Signed APK not found at ${releaseApkPath}`);
  }

  const adbPath = resolveAdbPath();
  console.log(`[release-install] Using adb: ${adbPath}`);

  const devices = run(adbPath, ["devices"], { captureOutput: true });
  const parsedDevices = (devices.stdout || "")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("List of devices"))
    .map((line) => {
      const [serial, state] = line.split(/\s+/);
      return { serial, state, line };
    });

  const onlineDevices = parsedDevices.filter((entry) => entry.state === "device");
  if (onlineDevices.length === 0) {
    process.stdout.write(devices.stdout || "");
    throw new Error("No online adb device found. Start your emulator/phone and retry.");
  }

  let selectedSerial = "";
  if (targetDevice) {
    const exact = onlineDevices.find((entry) => entry.serial === targetDevice);
    if (!exact) {
      const found = onlineDevices.map((entry) => entry.serial).join(", ") || "none";
      throw new Error(`Requested device '${targetDevice}' is not online. Available: ${found}`);
    }
    selectedSerial = exact.serial;
  } else {
    selectedSerial = onlineDevices[0].serial;
  }

  console.log(`[release-install] Target device: ${selectedSerial}`);

  console.log("[release-install] Installing APK on connected device...");
  installApk(adbPath, selectedSerial);

  console.log("[release-install] Launching app...");
  run(adbPath, toDeviceArgs(selectedSerial, [
    "shell",
    "monkey",
    "-p",
    "com.android.caloriecounter",
    "-c",
    "android.intent.category.LAUNCHER",
    "1",
  ]));

  console.log("[release-install] Done.");
} catch (error) {
  console.error(`[release-install] Failed: ${error.message}`);
  process.exit(1);
}

