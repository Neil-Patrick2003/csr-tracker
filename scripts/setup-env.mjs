#!/usr/bin/env node

/**
 * Setup script to sync .env file values to app.json for Expo
 * This is run before expo start to ensure env variables are available
 */

import fs from "fs";
import path from "path";

const envPath = path.resolve("./", ".env");
const appJsonPath = path.resolve("./", "app.json");

// Read .env file
let envVars = {};
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  envContent.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const [key, ...valueParts] = trimmed.split("=");
      const k = key.trim();
      const v = valueParts.join("=").trim();
      if (k && v) {
        envVars[k] = v;
      }
    }
  });
  console.log("✓ Loaded .env variables");
}

// Read app.json
const appJson = JSON.parse(fs.readFileSync(appJsonPath, "utf-8"));

// Update extra config
if (!appJson.expo.extra) {
  appJson.expo.extra = {};
}

appJson.expo.extra.apiBaseUrl =
  envVars.REACT_APP_API_BASE_URL ||
  appJson.expo.extra.apiBaseUrl ||
  "https://artemis.ph/api/v1/public";

appJson.expo.extra.apiKey =
  envVars.REACT_APP_API_KEY || appJson.expo.extra.apiKey || "";

// Write back to app.json
fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2));
console.log("✓ Updated app.json with environment variables");
