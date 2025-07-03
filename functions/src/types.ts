import type { Timestamp } from "firebase-admin/firestore";
import { defineString } from "firebase-functions/params";
import { HafasClient } from "hafas-client";

export interface Environment {
  apnsKey: ReturnType<typeof defineString>;
  apnsKeyId: ReturnType<typeof defineString>;
  appleDeveloperTeamId: ReturnType<typeof defineString>;
  appBundleId: ReturnType<typeof defineString>;
  hafasClient: HafasClient;
}

// See https://github.com/public-transport/hafas-client/blob/6/p/vbb/products.js
export enum Product {
  suburban = "suburban",
  subway = "subway",
  tram = "tram",
  bus = "bus",
  ferry = "ferry",
  regional = "regional",
  express = "express",
}

export interface LiveActivity {
  activityId: string;
  userDeviceId: string;
  createdAt: Timestamp;
  pushToken: string;
  stationId: string;
  stationName: string;
  enabledProducts: Product[];
  showCancelledDepartures: boolean;
}

export interface SearchResult {
  id: string;
  name: string;
  latitude?: number;
  longitude?: number;
  products: Product[];
}

export interface DepartureInfo {
  plannedTime: number;
  predictedTime: number | null;
}

export interface LiveActivityDepartureInfo extends DepartureInfo {
  lineLabel: string;
  destination: string;
  isCancelled: boolean;
}

export interface StationDepartureInfo extends DepartureInfo {
  id: string;
  line: {
    name?: string;
    productName?: string;
    product?: Product;
  };
  destination: string;
  isCancelled: boolean;
}
