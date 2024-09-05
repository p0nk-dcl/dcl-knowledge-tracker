'use client'
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps'
import { countryCoordinates } from '../utils/dcl/countryCoordinates';

const geoUrl = 'https://raw.githubusercontent.com/deldersveld/topojson/master/world-countries.json'

interface Attestation {
    id: string;
    tags: string[];
}

const getCoordinatesFromCountryCode = (countryCode: string): [number, number] => {
    return countryCoordinates[countryCode] || [0, 0];
};

export default function Map({ attestations }: { attestations: Attestation[] }) {
    return (
        <ComposableMap>
            <Geographies geography={geoUrl}>
                {({ geographies }: { geographies: any[] }) =>
                    geographies.map((geo) => (
                        <Geography key={geo.rsmKey} geography={geo} />
                    ))
                }
            </Geographies>
            {attestations.map((attestation) => {
                const locTag = attestation.tags.find(tag => tag.startsWith('@loc:'))
                if (locTag) {
                    const countryCode = locTag.split(':')[1]
                    const coordinates = getCoordinatesFromCountryCode(countryCode)
                    return (
                        <Marker key={attestation.id} coordinates={coordinates}>
                            <circle r={4} fill="#F00" />
                        </Marker>
                    )
                }
                return null
            })}
        </ComposableMap>
    )
}