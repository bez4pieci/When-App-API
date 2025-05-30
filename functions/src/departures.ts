import { DepartureInfo, LiveActivity } from "./types.js";
import { Alternative } from "hafas-client";
import { Departures } from "hafas-client";
import { createClient } from "hafas-client";
import { profile as bvgProfile } from "hafas-client/p/bvg/index.js";

const hafasClient = createClient(bvgProfile, "departures-api");

export async function getDepartures(activity: LiveActivity): Promise<DepartureInfo[]> {
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
