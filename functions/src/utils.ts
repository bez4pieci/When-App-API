import { StationName } from "./types.js";

export function getStationName(name: string): StationName {
  let extraName = undefined;
  let extraShortName = undefined;
  let extraInfo = undefined;
  let extraPlace = undefined;

  //console.log(`"${name}" | ${extraName} | ${extraShortName} | ${extraInfo} | ${extraPlace}`);

  // If name ends with a comma and a word, e.g., "Brandenburg, Hauptbahnhof", extract the word and remove it from the name
  const extraNamesAfterComma = ["Hauptbahnhof", "Bahnhof"];
  for (const extra of extraNamesAfterComma) {
    if (name.endsWith(`, ${extra}`)) {
      name = name.slice(0, -extra.length - 2);
      extraName = extra;
      break;
    }
  }

  // Set short name only for Hauptbahnhof, don't show short Bhf for Bahnhof
  if (extraName === "Hauptbahnhof") {
    extraShortName = "Hbf";
  }

  // If name ends with " (Berlin)", extract the city name
  // (This app is predominantly for Berlin (for now))
  const cityMatch = name.match(/ \((Berlin)\)$/);
  if (cityMatch) {
    extraPlace = cityMatch[1];
    name = name.slice(0, -cityMatch[0].length);
  }

  // if name ends with "Bhf", extract it
  if (name.endsWith(" Bhf")) {
    name = name.slice(0, -4);
    extraName = "Bahnhof";
    // Do not set short name for Bahnhof
  }

  // If name ends with something like " [Gleis 1-8]", extract it
  const infoMatch = name.match(/ \[([^\]]+)\]$/);
  if (infoMatch) {
    extraInfo = infoMatch[1];
    name = name.slice(0, -infoMatch[0].length);
  }

  // if name still ends with "Hauptbahnhof", extract it
  if (name.endsWith(" Hauptbahnhof")) {
    name = name.slice(0, -13);
    extraName = "Hauptbahnhof";
    extraShortName = "Hbf";
  }

  //console.log(`"${name}" | ${extraName} | ${extraShortName} | ${extraInfo} | ${extraPlace}`);

  return {
    name,
    extraName,
    extraShortName,
    extraInfo,
    extraPlace,
  };
}
