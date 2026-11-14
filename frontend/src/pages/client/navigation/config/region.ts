export const REGION = {
  name: "Kota Medan",
  state: "Sumatera Utara",
  country: "Indonesia",

  // Batas perkiraan: [latitude, longitude]
  bounds: [
    [3.45, 98.52],
    [3.75, 98.82],
  ] as [[number, number], [number, number]],

  // Pusat awal peta
  center: [3.5952, 98.6722] as [number, number],

  // Viewbox Nominatim: longitude, latitude
  searchViewbox: {
    west: 98.52,
    south: 3.45,
    east: 98.82,
    north: 3.75,
  },
};

export function isInsideRegion(lat: number, lng: number) {
  const [[south, west], [north, east]] = REGION.bounds;

  return lat >= south && lat <= north && lng >= west && lng <= east;
}
