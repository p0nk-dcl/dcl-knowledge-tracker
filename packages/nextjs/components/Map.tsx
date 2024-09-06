'use client'
import { useState, useEffect, useMemo } from 'react'
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from 'react-simple-maps'
import { Tooltip } from 'react-tooltip'
import { countryCoordinates } from '../utils/dcl/countryCoordinates'
import { getWorldData } from '../utils/dcl/worldData'
import { FeatureCollection, Geometry, GeoJsonProperties } from 'geojson';

// Create a simple GeoJSON object from the countryCoordinates
const geoData = {
    type: "FeatureCollection",
    features: Object.entries(countryCoordinates).map(([countryCode, coordinates]) => ({
        type: "Feature",
        properties: { ISO_A2: countryCode },
        geometry: {
            type: "Point",
            coordinates: coordinates.reverse() // GeoJSON uses [longitude, latitude]
        }
    }))
};

interface Attestation {
    id: string;
    tags: string[];
    authors: string[];
    // Add other properties you want to display in the tooltip
}

interface MapProps {
    attestations: Attestation[];
    onCountryClick: (countryCode: string) => void;
}

const getCoordinatesFromCountryCode = (countryCode: string): [number, number] => {
    return countryCoordinates[countryCode] || [0, 0];
};

export default function Map({ attestations, onCountryClick }: MapProps) {
    const [worldData, setWorldData] = useState<FeatureCollection<Geometry, GeoJsonProperties> | null>(null);
    const [zoom, setZoom] = useState(1);

    useEffect(() => {
        getWorldData().then(setWorldData);
    }, []);

    const attestationsByCountry = useMemo(() => {
        const countryMap: Record<string, Attestation[]> = {};
        attestations.forEach(attestation => {
            const locTag = attestation.tags.find(tag => tag.startsWith('@loc:'));
            if (locTag) {
                const countryCode = locTag.split(':')[1];
                countryMap[countryCode] = countryMap[countryCode] || [];
                countryMap[countryCode].push(attestation);
            }
        });
        return countryMap;
    }, [attestations]);

    return (
        <div className="relative w-full h-[calc(100vh-150px)]"> {/* Adjusted height */}
            <ComposableMap
                projection="geoMercator"
                projectionConfig={{ scale: 100 }} // Adjust this value to change map size
                width={800}
                height={400}
            >
                <ZoomableGroup center={[0, 20]} zoom={zoom} maxZoom={5} minZoom={1}>
                    {worldData && (
                        <Geographies geography={worldData}>
                            {({ geographies }) =>
                                geographies.map((geo) => (
                                    <Geography
                                        key={geo.rsmKey}
                                        geography={geo}
                                        fill="#EAEAEC"
                                        stroke="#D6D6DA"
                                    />
                                ))
                            }
                        </Geographies>
                    )}
                    {Object.entries(attestationsByCountry).map(([countryCode, countryAttestations]) => {
                        const coordinates = getCoordinatesFromCountryCode(countryCode);
                        return (
                            <Marker
                                key={countryCode}
                                coordinates={coordinates}
                                data-tooltip-id="attestation-tooltip"
                                data-tooltip-content={`${countryCode}: ${countryAttestations.length} attestation(s)`}
                                onClick={() => onCountryClick(countryCode)}
                            >
                                <circle r={Math.min(30, Math.max(10, Math.sqrt(countryAttestations.length) * 5))} fill="#F00" />
                                <text
                                    textAnchor="middle"
                                    y={4}
                                    style={{ fontFamily: "system-ui", fill: "#fff", fontSize: "12px" }}
                                >
                                    {countryAttestations.length}
                                </text>
                            </Marker>
                        )
                    })}
                </ZoomableGroup>
            </ComposableMap>
            <div className="absolute top-0 right-0 p-2">
                <button onClick={() => setZoom(z => Math.min(z + 0.5, 5))} className="bg-blue-500 text-white p-2 m-1">+</button>
                <button onClick={() => setZoom(z => Math.max(z - 0.5, 1))} className="bg-blue-500 text-white p-2 m-1">-</button>
            </div>
            <Tooltip id="attestation-tooltip" />
        </div>
    )
}