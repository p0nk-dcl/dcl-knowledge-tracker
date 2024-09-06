import { feature } from 'topojson-client';
import { FeatureCollection, Geometry } from 'geojson';
import { GeometryObject, Topology } from 'topojson-specification';

export async function getWorldData(): Promise<FeatureCollection> {
    const response = await fetch('https://unpkg.com/world-atlas@2.0.2/countries-110m.json');
    const topology = await response.json() as Topology;
    const result = feature(topology, topology.objects.countries as GeometryObject);
    const countries: FeatureCollection = 'features' in result ? result : { type: 'FeatureCollection', features: [result] };
    return countries;
}