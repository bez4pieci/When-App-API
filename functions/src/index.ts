import { update } from "./live-activity.js";
import { Environment } from "./types.js";
import { initializeApp } from "firebase-admin/app";
import { onCall } from "firebase-functions/https";
import { log, error as logError } from "firebase-functions/logger";
import { defineString } from "firebase-functions/params";
import { onSchedule } from "firebase-functions/v2/scheduler";

const environment: Environment = {
  apnsKey: defineString("APNS_KEY"),
  apnsKeyId: defineString("APNS_KEY_ID"),
  appleDveloperTeamId: defineString("APPLE_DEVELOPER_TEAM_ID"),
  appBundleId: defineString("APP_BUNDLE_ID"),
};

initializeApp();

// Direct function for testing
export const updateLiveActivities = onCall(
  {
    region: "europe-west1",
  },
  async () => await update(environment)
);

// Scheduled function to run every 30 seconds
export const updateLiveActivitiesOnSchedule = onSchedule(
  {
    schedule: "* * * * *",
    timeZone: "Europe/Berlin",
    region: "europe-west1",
  },
  async event => await update(environment)
);
