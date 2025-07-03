import { getDeparturesForStation } from "./departures.js";
import { update } from "./live-activity.js";
import { search } from "./search-stations.js";
import { Environment, Product } from "./types.js";
import { initializeApp } from "firebase-admin/app";
import { log, error as logError } from "firebase-functions/logger";
import { defineString } from "firebase-functions/params";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { Profile, createClient } from "hafas-client";
import { profile as bvgProfile } from "hafas-client/p/bvg/index.js";
import { profile as vbbProfile } from "hafas-client/p/vbb/index.js";

const profiles = {
  bvg: bvgProfile as Profile,
  vbb: vbbProfile as Profile,
};

const profile = profiles.vbb;
const hafasClient = createClient(profile, "when-api");

const environment: Environment = {
  apnsKey: defineString("APNS_KEY"),
  apnsKeyId: defineString("APNS_KEY_ID"),
  appleDeveloperTeamId: defineString("APPLE_DEVELOPER_TEAM_ID"),
  appBundleId: defineString("APP_BUNDLE_ID"),
  hafasClient: hafasClient,
};

const REGION = "europe-west1";
const TIME_ZONE = "Europe/Berlin";

initializeApp();

// MARK: - Function for station search by partial name

export const searchStations = onCall(
  {
    region: REGION,
  },
  async request => {
    const query = request.data?.query;

    if (typeof query !== "string" || !query.trim()) {
      throw new HttpsError("invalid-argument", "Missing or invalid 'query' parameter");
    }

    try {
      const results = await search(environment, query);
      log(`searchStations: fetched ${results.length} results for query "${query}"`);
      return { results };
    } catch (err) {
      logError(`searchStations: failed getting results for query "${query}"`, err);
      throw new HttpsError("unknown", (err as Error)?.message || "Station search failed", err);
    }
  }
);

// MARK: - Function for listing departures for a station id

export const queryDepartures = onCall(
  {
    region: REGION,
  },
  async request => {
    const stationId = request.data?.stationId;
    const products = (request.data?.products || []) as Product[];
    const showCancelledDepartures = request.data?.showCancelledDepartures || false;

    if (typeof stationId !== "string" || !stationId.trim()) {
      throw new HttpsError("invalid-argument", "Missing or invalid 'stationId' parameter");
    }

    if (!Array.isArray(products)) {
      throw new HttpsError("invalid-argument", "Invalid 'products' parameter");
    }
    if (products.some(product => !Object.values(Product).includes(product))) {
      throw new HttpsError("invalid-argument", "Invalid 'products' parameter");
    }

    try {
      const departures = await getDeparturesForStation({
        environment,
        stationId,
        products,
        showCancelledDepartures,
      });
      log(
        `queryDepartures: fetched ${departures.length} departures for station ${stationId}, products: ${products.join(", ")}, showCancelledDepartures: ${showCancelledDepartures}`
      );
      return { departures };
    } catch (err) {
      logError(`queryDepartures: failed getting departures for station ${stationId}`, err);
      throw new HttpsError("unknown", (err as Error)?.message || "Querying departures failed", err);
    }
  }
);

// MARK: - Functions for updating live activities

// Direct function for testing
export const updateLiveActivities = onCall(
  {
    region: REGION,
  },
  async () => await update(environment)
);

// Scheduled function to run every 30 seconds
export const updateLiveActivitiesOnSchedule = onSchedule(
  {
    schedule: "* * * * *",
    timeZone: TIME_ZONE,
    region: REGION,
  },
  async event => await update(environment)
);
