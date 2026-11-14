
import L from "leaflet";
import { Marker, Popup } from "react-leaflet";
import type { RoadHazardFeature } from "../types/hazards.types";

interface HazardMarkersProps {
    hazards: RoadHazardFeature[];
}

const severityColors: Record<string, string> = {
    ringan: "#CA8A04",
    sedang: "#EA580C",
    berat: "#DC2626",
};

function createHazardIcon(color: string) {
    return L.divIcon({
        className: "",
        html: `
            <div style="width:38px;height:42px;display:flex;align-items:center;justify-content:center;filter:drop-shadow(0 2px 3px rgba(0,0,0,.25))">
                <svg viewBox="0 0 38 42" width="38" height="42"
                    xmlns="http://www.w3.org/2000/svg">
                    <path d="M19 1C9 1 2 8 2 17C2 27 19 41 19 41S36 27 36 17C36 8 29 1 19 1Z"
                        fill="${color}" stroke="#ffffff" stroke-width="2"/>
                    <path d="M19 9L28 25H10L19 9Z"
                        fill="#ffffff" stroke="#ffffff" stroke-linejoin="round"/>
                    <path d="M19 14V19" stroke="${color}" stroke-width="2.5" stroke-linecap="round"/>
                    <circle cx="19" cy="22" r="1.3" fill="${color}"/>
                </svg>
            </div>
        `,
        iconSize: [38, 42],
        iconAnchor: [19, 41],
        popupAnchor: [0, -38],
    });
}

export default function HazardMarkers({
    hazards,
}: HazardMarkersProps) {
    return (
        <>
            {hazards.map((hazard) => {
                const [lng, lat] = hazard.geometry.coordinates;
                const {
                    id,
                    title,
                    address,
                    severity,
                    status,
                    images,
                } = hazard.properties;

                const color =
                    severityColors[severity?.toLowerCase()] ?? "#DC2626";

                return (
                    <Marker
                        key={id}
                        position={[lat, lng]}
                        icon={createHazardIcon(color)}
                    >
                        <Popup>
                            <div className="w-56 space-y-2">
                                <h3 className="font-semibold">{title}</h3>

                                <p className="text-sm">
                                    <strong>Alamat:</strong> {address}
                                </p>

                                <p className="text-sm">
                                    <strong>Tingkat kerusakan:</strong>{" "}
                                    {severity}
                                </p>

                                <p className="text-sm">
                                    <strong>Status:</strong> {status}
                                </p>

                                {images?.[0] && (
                                    <img
                                        src={images[0]}
                                        alt={title}
                                        className="h-32 w-full rounded object-cover"
                                    />
                                )}
                            </div>
                        </Popup>
                    </Marker>
                );
            })}
        </>
    );
}
