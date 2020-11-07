import React, { Component } from 'react';
import MapboxMap from 'react-mapbox-wrapper';
import StationService from '../services/StationService.js';

class Map extends Component {
    constructor(props) {
        super(props);
        this.onMapLoad = this.onMapLoad.bind(this);
        this.handleStationClick = this.handleStationClick.bind(this);
    }

    componentDidUpdate(prevProps) {
        if (prevProps !== this.props){
            this.setStations();
        }
    }

    onMapLoad(map) {
        map.addSource('stations', {
            'type': 'geojson',
            'data': {
                'type': 'FeatureCollection',
                'features': []
            }
        });
        map.addLayer({
            'id': 'stations',
            'type': 'symbol',
            'source': 'stations',
            'layout': {
                'icon-image': 'blue-dot',
                'icon-allow-overlap': true,
            }
        });
        this.map = map;
        this.setStations();
        this.forceUpdate();
    }

    setStations() {
        let stationService = new StationService();
        let stations = stationService.getStations();
        let features = []
        stations.forEach(element => {
            if (
                this.props.search &&
                (
                    (this.props.search.minPopulation && this.props.search.minPopulation > element.population) ||
                    (this.props.search.maxPopulation && this.props.search.maxPopulation < element.population) ||
                    (this.props.search.minTravelTime && this.props.search.minTravelTime > element.travelTime) ||
                    (this.props.search.maxTravelTime && this.props.search.maxTravelTime < element.travelTime)
                )
            ) {
                return;
            }
            features.push({
                "type": "Feature",
                "id": element.id,
                "geometry": {
                    "type": "Point",
                    "coordinates": [element.lng, element.lat]
                },
                "properties": {
                    "city": element.city,
                    "population": element.population,
                    "travelTime": element.travelTime,
                }
            })
        });
        this.map.getSource('stations').setData({
            'type': 'FeatureCollection',
            'features': features
        })
    }

    handleStationClick(event) {
        let features = this.map.queryRenderedFeatures(event.point, {layers: ['stations']});
        if (features.length === 0) {
            return;
        }
        this.props.onStationClick(features[0].properties);
    }

    render() {
        return (
            <div style={{ height: "100vh", width: "50%"}}>
                <MapboxMap
                    accessToken="pk.eyJ1IjoibWVpbGxldXJzYWdlbnRzIiwiYSI6ImNqMWV5YnRpMDAwMHkyeXRnd3JkdXRiaDEifQ.emcFsn3Ox6WcKmOHhbTOPQ"
                    zoom="5"
                    style="mapbox://styles/meilleursagents/cjfm7js7u0o552snxqa6g7vxr"
                    coordinates={{ lat: 48.8565848333607, lng: 2.34298812806494 }}
                    onLoad={this.onMapLoad}
                    onClick={this.handleStationClick}
                >
                </MapboxMap>
            </div>
        )
    }
}

export default Map;