import { getEndNotification } from "./apns.js";
import { getUpdateNotification } from "./apns.js";
import { getDepartures } from "./departures.js";
import type { DepartureInfo, LiveActivity } from "./types.js";
import * as apn from "@parse/node-apn";
import { initializeApp } from "firebase-admin/app";
import { Timestamp, getFirestore } from "firebase-admin/firestore";
import { onCall } from "firebase-functions/https";
import { log, error as logError } from "firebase-functions/logger";
import { defineString } from "firebase-functions/params";
import { onSchedule } from "firebase-functions/v2/scheduler";

const environment = {
  apnsKey: defineString("APNS_KEY"),
  apnsKeyId: defineString("APNS_KEY_ID"),
  appleDveloperTeamId: defineString("APPLE_DEVELOPER_TEAM_ID"),
  appBundleId: defineString("APP_BUNDLE_ID"),
};

initializeApp();

async function _update() {
  log("Starting live activities update");

  // Initialize APNs provider
  const apnProvider = new apn.Provider({
    token: {
      key: environment.apnsKey.value(),
      keyId: environment.apnsKeyId.value(),
      teamId: environment.appleDveloperTeamId.value(),
    },
    production: true,
  });

  try {
    const db = getFirestore();
    const activitiesSnapshot = await db.collection("liveActivities").get();
    log(`Found ${activitiesSnapshot.size} total live activities`);

    const departuresCache: Record<string, DepartureInfo[]> = {};

    // Process each activity
    const updatePromises = activitiesSnapshot.docs.map(async doc => {
      const activity = doc.data() as LiveActivity;

      try {
        // Check if activity is older than 1 hour
        const activityAge = activity.createdAt as Timestamp;
        const now = Timestamp.now();
        const oneHourAgo = new Timestamp(now.seconds - 3600, now.nanoseconds);
        const isOlderThanOneHour = activityAge.seconds < oneHourAgo.seconds;

        if (isOlderThanOneHour) {
          // Send end notification for activities older than 1 hour
          log(`Ending activity ${activity.activityId} (older than 1 hour)`);

          const notification = getEndNotification(environment.appBundleId.value(), activity);
          const result = await apnProvider.send(notification, activity.pushToken);

          if (result.failed.length > 0) {
            logError(`Failed to end activity ${activity.activityId}: ${result.failed[0].response?.reason}`);
          } else {
            log(`Successfully ended activity ${activity.activityId} from ${activity.createdAt.toDate().toISOString()}`);
          }
        } else {
          // Send update notification for activities less than 1 hour old
          const departures = departuresCache[activity.stationId] || (await getDepartures(activity));
          departuresCache[activity.stationId] = departures;

          log(`Got ${departures.length} departures for station ${activity.stationName}`);

          const notification = getUpdateNotification(environment.appBundleId.value(), activity, departures);
          const result = await apnProvider.send(notification, activity.pushToken);

          if (result.failed.length > 0) {
            logError(
              `Failed to send notification for activity ${activity.activityId}: ${result.failed[0].response?.reason}`
            );
          } else {
            log(`Successfully sent update for activity ${activity.activityId}`);
          }
        }
      } catch (err) {
        logError(`Error processing activity ${activity.activityId}:`, err);
      }
    });

    await Promise.all(updatePromises);
    log("Completed live activities update");
  } catch (err) {
    logError("Error in updateLiveActivities:", err);
  }
}

// Direct function for testing
export const updateLiveActivities = onCall(
  {
    region: "europe-west1",
  },
  async () => await _update()
);

// Scheduled function to run every 30 seconds
export const updateLiveActivitiesOnSchedule = onSchedule(
  {
    schedule: "* * * * *",
    timeZone: "Europe/Berlin",
    region: "europe-west1",
  },
  async event => await _update()
);
