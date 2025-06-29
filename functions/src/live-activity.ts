import { getEndNotification } from "./apns.js";
import { getUpdateNotification } from "./apns.js";
import { getDepartures } from "./departures.js";
import { DepartureInfo, Environment, LiveActivity } from "./types.js";
import * as apn from "@parse/node-apn";
import { Timestamp, getFirestore } from "firebase-admin/firestore";
import { log, error as logError } from "firebase-functions/logger";

export async function update(environment: Environment) {
  log("Starting live activities update");

  // Initialize APNs provider
  const apnProvider = new apn.Provider({
    token: {
      key: environment.apnsKey.value(),
      keyId: environment.apnsKeyId.value(),
      teamId: environment.appleDveloperTeamId.value(),
    },
    production: process.env.NODE_ENV === "production",
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
          await _sendEndNotification(activity, apnProvider, environment.appBundleId.value());
          await db.collection("liveActivities").doc(doc.id).delete();
        } else {
          await _sendUpdateNotification(activity, departuresCache, apnProvider, environment.appBundleId.value());
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

// MARK: - Private

async function _sendUpdateNotification(
  activity: LiveActivity,
  departuresCache: Record<string, DepartureInfo[]>,
  apnProvider: apn.Provider,
  appBundleId: string
) {
  const departures = departuresCache[activity.stationId] || (await getDepartures(activity));
  departuresCache[activity.stationId] = departures;

  log(`Got ${departures.length} departures for station ${activity.stationName}`);

  const notification = getUpdateNotification(appBundleId, activity, departures);
  const result = await apnProvider.send(notification, activity.pushToken);

  if (result.failed.length > 0) {
    logError(`Failed to send notification for activity ${activity.activityId}: ${result.failed[0].response?.reason}`);
  } else {
    log(`Successfully sent update for activity ${activity.activityId}`);
  }
}

async function _sendEndNotification(activity: LiveActivity, apnProvider: apn.Provider, appBundleId: string) {
  log(`Ending activity ${activity.activityId} (older than 1 hour)`);

  const notification = getEndNotification(appBundleId, activity);
  const result = await apnProvider.send(notification, activity.pushToken);

  if (result.failed.length > 0) {
    logError(`Failed to end activity ${activity.activityId}: ${result.failed[0].response?.reason}`);
  } else {
    log(`Successfully ended activity ${activity.activityId} from ${activity.createdAt.toDate().toISOString()}`);
  }
}
