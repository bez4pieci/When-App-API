import type { Timestamp } from "firebase-admin/firestore";

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
}

export interface DepartureInfo {
  lineLabel: string;
  destination: string;
  plannedTime: number;
  predictedTime: number | null;
  isCancelled: boolean;
}
