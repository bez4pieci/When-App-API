import { StationName } from "./types.js";

export function getStationName(originalName: string): StationName {
  let clean = originalName;
  let stationSuffix = undefined;
  let stationSuffixShort = undefined;
  let extraInfo = undefined;
  let place = undefined;

  //console.log(`"${name}" | ${extraName} | ${extraShortName} | ${extraInfo} | ${extraPlace}`);

  // If name ends with a comma and a word, e.g., "Brandenburg, Hauptbahnhof", extract the word and remove it from the name
  const extraNamesAfterComma = ["Hauptbahnhof", "Bahnhof"];
  const DELIMITER_COMMA_SPACE = ", ";
  for (const extra of extraNamesAfterComma) {
    if (clean.endsWith(`${DELIMITER_COMMA_SPACE}${extra}`)) {
      clean = clean.slice(0, -extra.length - DELIMITER_COMMA_SPACE.length);
      stationSuffix = extra;
      break;
    }
  }

  // Set short name only for Hauptbahnhof, don't show short Bhf for Bahnhof
  if (stationSuffix === "Hauptbahnhof") {
    stationSuffixShort = "Hbf";
  }

  // If name ends with " (Berlin)", extract the city name
  // (This app is predominantly for Berlin (for now))
  const cityMatch = clean.match(/ \((Berlin)\)$/);
  if (cityMatch) {
    place = cityMatch[1];
    clean = clean.slice(0, -cityMatch[0].length);
  }

  // if name ends with "Bhf", extract it
  if (clean.endsWith(" Bhf")) {
    clean = clean.slice(0, -4);
    stationSuffix = "Bahnhof";
    // Do not set short name for Bahnhof
  }

  // If name ends with something like " [Gleis 1-8]", extract it
  const infoMatch = clean.match(/ \[([^\]]+)\]$/);
  if (infoMatch) {
    extraInfo = infoMatch[1];
    clean = clean.slice(0, -infoMatch[0].length);
  }

  // if name still ends with "Hauptbahnhof", extract it
  if (clean.endsWith(" Hauptbahnhof")) {
    clean = clean.slice(0, -13);
    stationSuffix = "Hauptbahnhof";
    stationSuffixShort = "Hbf";
  }

  //console.log(`"${name}" | ${extraName} | ${extraShortName} | ${extraInfo} | ${extraPlace}`);

  return {
    raw: originalName,
    clean,
    suffix: stationSuffix,
    suffixShort: stationSuffixShort,
    extraInfo,
    place,
  };
}
