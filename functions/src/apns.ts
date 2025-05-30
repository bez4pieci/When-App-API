import { DepartureInfo, LiveActivity } from "./types.js";
import * as apn from "@parse/node-apn";

export function getUpdateNotification(
  appBundleId: string,
  activity: LiveActivity,
  departures: DepartureInfo[]
): apn.Notification {
  const notification = new apn.Notification();
  notification.topic = `${appBundleId}.push-type.liveactivity`;
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

export function getEndNotification(appBundleId: string, activity: LiveActivity): apn.Notification {
  const notification = new apn.Notification();
  notification.topic = `${appBundleId}.push-type.liveactivity`;
  notification.pushType = "liveactivity";
  notification.priority = 10;

  notification.aps = {
    timestamp: Math.floor(Date.now() / 1000),
    event: "end",
    "content-state": {},
    "dismissal-date": Math.floor(Date.now() / 1000),
  };

  notification.payload = {
    "activity-id": activity.activityId,
  };

  return notification;
}
