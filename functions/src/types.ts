import type { Timestamp } from "firebase-admin/firestore";
import { defineString } from "firebase-functions/params";
import { HafasClient } from "hafas-client";

export interface Environment {
  apnsKey: ReturnType<typeof defineString>;
  apnsKeyId: ReturnType<typeof defineString>;
  appleDveloperTeamId: ReturnType<typeof defineString>;
  appBundleId: ReturnType<typeof defineString>;
  hafasClient: HafasClient;
}

export enum ProductInApp {
  suburbanTrain = "suburbanTrain",
  subway = "subway",
  tram = "tram",
  bus = "bus",
  regionalTrain = "regionalTrain",
  ferry = "ferry",
  highSpeedTrain = "highSpeedTrain",
  onDemand = "onDemand",
  cablecar = "cablecar",
}

export interface LiveActivity {
  activityId: string;
  userDeviceId: string;
  createdAt: Timestamp;
  pushToken: string;
  stationId: string;
  stationName: string;
  enabledProducts: ProductInApp[];
  showCancelledDepartures: boolean;
}

export interface DepartureInfo {
  lineLabel: string;
  destination: string;
  plannedTime: number;
  predictedTime: number | null;
  isCancelled: boolean;
}
