export const CITY_COORDS: Record<string, [number, number]> = {
  milano: [45.4642, 9.19],
  milan: [45.4642, 9.19],
  torino: [45.0703, 7.6869],
  turin: [45.0703, 7.6869],
  bologna: [44.4949, 11.3426],
  roma: [41.9028, 12.4964],
  rome: [41.9028, 12.4964],
  napoli: [40.8518, 14.2681],
  naples: [40.8518, 14.2681],
  firenze: [43.7696, 11.2558],
  florence: [43.7696, 11.2558],
  verona: [45.4384, 10.9916],
  palermo: [38.1157, 13.3615],
  genova: [44.4056, 8.9463],
  genoa: [44.4056, 8.9463],
  padova: [45.4064, 11.8768],
  padua: [45.4064, 11.8768],
};

export function normalizeItalianCitySearch(value?: string | null) {
  return (
    value
      ?.trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim()
      .replace(/\s+/g, " ") ?? ""
  );
}

export function cityKey(value?: string | null) {
  return normalizeItalianCitySearch(value?.split(",")[0]);
}

export function coordsForCityCountry(
  city?: string | null,
  country?: string | null,
) {
  const normalizedCity = cityKey(city);
  if (!normalizedCity) return null;

  const normalizedCountry = country?.trim().toLowerCase();
  if (
    normalizedCountry &&
    !["italy", "italia", "it"].includes(normalizedCountry)
  ) {
    return null;
  }

  return CITY_COORDS[normalizedCity] ?? null;
}

export function fallbackCoordsForLocation(location?: string | null) {
  const normalizedLocation = cityKey(location);
  return normalizedLocation ? CITY_COORDS[normalizedLocation] ?? null : null;
}

export function locationLabel({
  city,
  country,
  fallback,
}: {
  city?: string | null;
  country?: string | null;
  fallback?: string | null;
}) {
  const normalizedCity = city?.trim();
  const normalizedCountry = country?.trim();
  if (normalizedCity && normalizedCountry) {
    return `${normalizedCity}, ${normalizedCountry}`;
  }
  return normalizedCity || normalizedCountry || fallback?.trim() || "Italy";
}
