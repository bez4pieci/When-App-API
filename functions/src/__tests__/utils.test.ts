import { getStationName } from "../utils.js";

describe("getStationName", () => {
  it("should handle simple station names without any suffixes", () => {
    const result = getStationName("Hamburg-Altona");
    expect(result).toEqual({
      raw: "Hamburg-Altona",
      clean: "Hamburg-Altona",
      suffix: undefined,
      suffixShort: undefined,
      extraInfo: undefined,
      place: undefined,
    });
  });

  it("should handle station names with comma and Bahnhof suffix", () => {
    const result = getStationName("Frankfurt (Oder), Bahnhof");
    expect(result).toEqual({
      raw: "Frankfurt (Oder), Bahnhof",
      clean: "Frankfurt (Oder)",
      suffix: "Bahnhof",
      suffixShort: undefined,
      extraInfo: undefined,
      place: undefined,
    });
  });

  it("should handle station names with comma and Bahnhof suffix (another example)", () => {
    const result = getStationName("Nauen, Bahnhof");
    expect(result).toEqual({
      raw: "Nauen, Bahnhof",
      clean: "Nauen",
      suffix: "Bahnhof",
      suffixShort: undefined,
      extraInfo: undefined,
      place: undefined,
    });
  });

  it("should handle station names with Berlin place in parentheses", () => {
    const result = getStationName("S Greifswalder Str. (Berlin)");
    expect(result).toEqual({
      raw: "S Greifswalder Str. (Berlin)",
      clean: "S Greifswalder Str.",
      suffix: undefined,
      suffixShort: undefined,
      extraInfo: undefined,
      place: "Berlin",
    });
  });

  it("should handle station names with comma and Hauptbahnhof suffix", () => {
    const result = getStationName("München, Hauptbahnhof");
    expect(result).toEqual({
      raw: "München, Hauptbahnhof",
      clean: "München",
      suffix: "Hauptbahnhof",
      suffixShort: "Hbf",
      extraInfo: undefined,
      place: undefined,
    });
  });

  it("should handle station names with comma and Hauptbahnhof suffix (another example)", () => {
    const result = getStationName("Lutherstadt Wittenberg, Hauptbahnhof");
    expect(result).toEqual({
      raw: "Lutherstadt Wittenberg, Hauptbahnhof",
      clean: "Lutherstadt Wittenberg",
      suffix: "Hauptbahnhof",
      suffixShort: "Hbf",
      extraInfo: undefined,
      place: undefined,
    });
  });

  it("should handle station names with Bhf suffix and Berlin place", () => {
    const result = getStationName("S+U Gesundbrunnen Bhf (Berlin)");
    expect(result).toEqual({
      raw: "S+U Gesundbrunnen Bhf (Berlin)",
      clean: "S+U Gesundbrunnen",
      suffix: "Bahnhof",
      suffixShort: undefined,
      extraInfo: undefined,
      place: "Berlin",
    });
  });

  it("should handle station names with extra info in brackets", () => {
    const result = getStationName("S+U Alexanderpl./Grunerstr.(Bln) [Grunerstr.]");
    expect(result).toEqual({
      raw: "S+U Alexanderpl./Grunerstr.(Bln) [Grunerstr.]",
      clean: "S+U Alexanderpl./Grunerstr.(Bln)",
      suffix: undefined,
      suffixShort: undefined,
      extraInfo: "Grunerstr.",
      place: undefined,
    });
  });

  it("should handle station names with only Bhf suffix", () => {
    const result = getStationName("S Hennigsdorf Bhf");
    expect(result).toEqual({
      raw: "S Hennigsdorf Bhf",
      clean: "S Hennigsdorf",
      suffix: "Bahnhof",
      suffixShort: undefined,
      extraInfo: undefined,
      place: undefined,
    });
  });

  it("should handle station names with Hauptbahnhof suffix and extra info", () => {
    const result = getStationName("S+U Berlin Hauptbahnhof [Gleis 1-8]");
    expect(result).toEqual({
      raw: "S+U Berlin Hauptbahnhof [Gleis 1-8]",
      clean: "S+U Berlin",
      suffix: "Hauptbahnhof",
      suffixShort: "Hbf",
      extraInfo: "Gleis 1-8",
      place: undefined,
    });
  });

  it("should handle station names with Bhf suffix and non-Berlin place", () => {
    const result = getStationName("S Blankenfelde (TF) Bhf");
    expect(result).toEqual({
      raw: "S Blankenfelde (TF) Bhf",
      clean: "S Blankenfelde (TF)",
      suffix: "Bahnhof",
      suffixShort: undefined,
      extraInfo: undefined,
      place: undefined,
    });
  });

  // Additional edge cases
  it("should handle empty string", () => {
    const result = getStationName("");
    expect(result).toEqual({
      raw: "",
      clean: "",
      suffix: undefined,
      suffixShort: undefined,
      extraInfo: undefined,
      place: undefined,
    });
  });

  it("should handle station names with only place (Berlin)", () => {
    const result = getStationName("Station (Berlin)");
    expect(result).toEqual({
      raw: "Station (Berlin)",
      clean: "Station",
      suffix: undefined,
      suffixShort: undefined,
      extraInfo: undefined,
      place: "Berlin",
    });
  });

  it("should handle station names with only extra info in brackets", () => {
    const result = getStationName("Station [Platform 1]");
    expect(result).toEqual({
      raw: "Station [Platform 1]",
      clean: "Station",
      suffix: undefined,
      suffixShort: undefined,
      extraInfo: "Platform 1",
      place: undefined,
    });
  });

  it("should handle station names with multiple processing steps", () => {
    const result = getStationName("Berlin, Hauptbahnhof [Gleis 1-8]");
    expect(result).toEqual({
      raw: "Berlin, Hauptbahnhof [Gleis 1-8]",
      clean: "Berlin",
      suffix: "Hauptbahnhof",
      suffixShort: "Hbf",
      extraInfo: "Gleis 1-8",
      place: undefined,
    });
  });

  it("should handle station names with Berlin place and extra info", () => {
    const result = getStationName("Station (Berlin) [Info]");
    expect(result).toEqual({
      raw: "Station (Berlin) [Info]",
      clean: "Station",
      suffix: undefined,
      suffixShort: undefined,
      extraInfo: "Info",
      place: "Berlin",
    });
  });

  it("should handle station names with non-Berlin place in parentheses", () => {
    const result = getStationName("Station (Hamburg)");
    expect(result).toEqual({
      raw: "Station (Hamburg)",
      clean: "Station (Hamburg)",
      suffix: undefined,
      suffixShort: undefined,
      extraInfo: undefined,
      place: undefined,
    });
  });

  // TODO: Is there a case like this?
  it("should handle station names with Bhf suffix, Berlin place and extra info", () => {
    const result = getStationName("Station (Berlin) Bhf [Platform 1]");
    expect(result).toEqual({
      raw: "Station (Berlin) Bhf [Platform 1]",
      clean: "Station (Berlin)",
      suffix: "Bahnhof",
      suffixShort: undefined,
      extraInfo: "Platform 1",
      place: undefined,
    });
  });

  it("should prioritize comma-separated suffixes over space-separated ones", () => {
    const result = getStationName("Berlin, Hauptbahnhof Hauptbahnhof");
    expect(result).toEqual({
      raw: "Berlin, Hauptbahnhof Hauptbahnhof",
      clean: "Berlin, Hauptbahnhof",
      suffix: "Hauptbahnhof",
      suffixShort: "Hbf",
      extraInfo: undefined,
      place: undefined,
    });
  });
});
