export interface RoadHazardProperties {
  id: string;
  title: string;
  address: string;
  severity: string;
  status: string;
  images: string[];
  passableBy: string[];
}

export interface RoadHazardFeature {
  type: "Feature";
  geometry: {
    type: "Point";
    // GeoJSON menggunakan urutan [longitude, latitude]
    coordinates: [number, number];
  };
  properties: RoadHazardProperties;
}

export interface RoadHazardsResponse {
  success: boolean;
  message: string;
  data: {
    type: "FeatureCollection";
    features: RoadHazardFeature[];
  };
}
