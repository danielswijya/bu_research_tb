/** Normalize join key to match backend arm identity (location|zona|district). */
export function siteJoinKey(locationName, zonaName, district) {
  const norm = (v) =>
    String(v ?? '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ');
  return `${norm(locationName)}|${norm(zonaName)}|${norm(district)}`;
}
