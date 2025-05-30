import type { DepartureInfo, LiveActivity } from "./types";
import * as apn from "@parse/node-apn";
import { initializeApp } from "firebase-admin/app";
import { Timestamp, getFirestore } from "firebase-admin/firestore";
import { onCall } from "firebase-functions/https";
import { log, error as logError } from "firebase-functions/logger";
import { defineString } from "firebase-functions/params";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { Alternative, Departures, HafasClient, createClient } from "hafas-client";
import { profile as bvgProfile } from "hafas-client/p/bvg/index.js";

const environment = {
  apnsKey: defineString("APNS_KEY"),
  apnsKeyId: defineString("APNS_KEY_ID"),
  appleDveloperTeamId: defineString("APPLE_DEVELOPER_TEAM_ID"),
  appBundleId: defineString("APP_BUNDLE_ID"),
};

initializeApp();

const hafasClient = createClient(bvgProfile, "departures-api");

async function getDepartures(hafasClient: HafasClient, activity: LiveActivity): Promise<DepartureInfo[]> {
  const departures: Departures = await hafasClient.departures(activity.stationId, {
    results: 4,
    duration: 60, // Look ahead 60 minutes
  });

  return departures.departures.map((dep: Alternative) => {
    const plannedTime = dep.plannedWhen ? new Date(dep.plannedWhen).getTime() / 1000 : 0;
    const predictedTime = dep.when && dep.when !== dep.plannedWhen ? new Date(dep.when).getTime() / 1000 : null;

    return {
      lineLabel: dep.line?.name || "Unknown",
      destination: dep.destination?.name || "Unknown",
      plannedTime,
      predictedTime,
      isCancelled: dep.cancelled || false,
    };
  });
}

function getNotification(activity: LiveActivity, departures: DepartureInfo[]): apn.Notification {
  const notification = new apn.Notification();
  notification.topic = `${environment.appBundleId.value()}.push-type.liveactivity`;
  notification.pushType = "liveactivity";
  notification.priority = 10;

  notification.aps = {
    timestamp: Math.floor(Date.now() / 1000),
    event: "update",
    "content-state": {
      departures: departures,
      lastUpdate: Math.floor(Date.now() / 1000),
    },
  };

  notification.payload = {
    "activity-id": activity.activityId,
  };

  return notification;
}

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
    const now = Timestamp.now();
    const oneHourAgo = new Timestamp(now.seconds - 3600, now.nanoseconds);

    // Query active live activities created within the last hour
    const activitiesSnapshot = await db.collection("liveActivities").where("createdAt", ">", oneHourAgo).get();

    log(`Found ${activitiesSnapshot.size} active live activities`);

    const departuresCache: Record<string, DepartureInfo[]> = {};

    // Process each activity
    const updatePromises = activitiesSnapshot.docs.map(async doc => {
      const activity = doc.data() as LiveActivity;

      try {
        const departures = departuresCache[activity.stationId] || (await getDepartures(hafasClient, activity));
        departuresCache[activity.stationId] = departures;

        log(`Got ${departures.length} departures for station ${activity.stationName}`);

        const notification = getNotification(activity, departures);
        const result = await apnProvider.send(notification, activity.pushToken);

        if (result.failed.length > 0) {
          logError(
            `Failed to send notification for activity ${activity.activityId}: ${result.failed[0].response?.reason}`
          );
        } else {
          log(`Successfully sent update for activity ${activity.activityId}`);

          // Update the activity's updatedAt timestamp
          await doc.ref.update({
            updatedAt: Timestamp.now(),
          });
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
