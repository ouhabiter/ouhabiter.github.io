import { Box, Paper, Tooltip } from '@material-ui/core';
import TimerIcon from '@material-ui/icons/Timer';
import React, { Component } from 'react';
import MapboxMap from 'react-mapbox-wrapper';
import MapHelper from '../helpers/MapHelper';
import { setDestination } from '../helpers/SearchHelper';
import TimeHelper from '../helpers/TimeHelper';
import CityService from '../services/CityService';
import { withRouter } from "react-router-dom";
import './Map.css';
import stationService from '../services/StationService';

class Map extends Component {
    constructor(props) {
        super(props);
        this.onMapLoad = this.onMapLoad.bind(this);
        this.handleMapClick = this.handleMapClick.bind(this);
        this.state = {
            colorScale: null,
            destination: null,
        }
    }

    componentDidUpdate(prevProps) {
        if (prevProps !== this.props){
            this.updateStations();
            this.updateColorScale();
        }
    }

    onMapLoad(map) {
        // layer order is important, current station must be last to be above all the other layers
        map.addSource('stations', {
            'type': 'geojson',
            'data': {
                'type': 'FeatureCollection',
                'features': []
            }
        });
        map.addLayer({
            'id': 'stations',
            'type': 'circle',
            'source': 'stations',
            'paint': {
                'circle-stroke-width': 1,
                'circle-stroke-color': '#000',
                'circle-radius': {
                    'base': 3,
                    'stops': [
                        [8, 4],
                        [8, 8],
                        [22, 180]
                    ]
                },
            }
        });
        map.addSource('itinerary', {
            'type': 'geojson',
            'data': {
                'type': 'LineString',
                'coordinates': []
            }
        });
        map.addLayer({
            'id': 'itinerary',
            'type': 'line',
            'source': 'itinerary',
            'layout': {
                'line-join': 'round',
                'line-cap': 'round'
            },
            'paint': {
                'line-color': '#33302E',
                'line-width': 3
            }
        });
        map.addSource('city-outline', {
            'type': 'geojson',
            'data': {
                'type': 'Polygon',
                'coordinates': []
            }
        });
        map.addLayer({
            'id': 'city-outline',
            'type': 'line',
            'source': 'city-outline',
            'paint': {
                'line-color': '#000000',
                'line-width': 1,
            }
        });
        this.map = map;
        this.updateStations();
        this.updateColorScale();
        this.forceUpdate();
        let searchParams = new URLSearchParams(this.props.location.search);
        this.setStation(searchParams.get('destination'));
    }

    updateStations() {
        if (!this.props.stations) {
            return;
        }
        let features = [];
        this.props.stations.forEach(station => {
            features.push(MapHelper.stationToFeature(station))
        });
        if (this.map) {
            this.map.getSource('stations').setData({
                'type': 'FeatureCollection',
                'features': features
            });
        }
    }

    updateColorScale() {
        let colorScale = MapHelper.buildColorScale(this.props.minTravelTime, this.props.maxTravelTime);
        let paintProperty = [
            'step',
            ['get', 'travelTime'],
            ...colorScale
        ];
        this.setState({
            colorScale: colorScale,
        });
        if (this.map) {
            this.map.setPaintProperty('stations', 'circle-color', paintProperty);
        }
    }

    handleMapClick(event) {
        let features = this.map.queryRenderedFeatures(event.point, {layers: ['stations']});
        let stationSlug = null;
        if (features.length > 0) {
            stationSlug = stationService.getSlugFromId(features[0].properties.id);
        }
        this.setStation(stationSlug);
    }

    setStation(stationSlug) {
        let station = stationService.getStationBySlug(stationSlug);
        if (!station) {
            setDestination(null);
            this.props.onDestinationChange(null);
            return;
        }
        setDestination(stationSlug);
        this.props.onDestinationChange(stationSlug);
        CityService.getCityOutline(station.toCityInseeCode).then((cityOutline) => {
            if (cityOutline) {
                this.map.getSource('city-outline').setData(cityOutline);
            } else {
                this.map.getLayer('city-outline').setLayoutProperty('visibility', 'none');
            }
        });
        stationService.getItinerary(`admin:fr:${this.props.fromCityInseeCode}`, station.stationId).then((itinerary) => {
            if (itinerary) {
                this.map.getSource('itinerary').setData(itinerary);
            } else {
                this.map.getLayer('itinerary').setLayoutProperty('visibility', 'none');
            }
        });
    }

    render() {
        return (
            <div style={{ height: "100vh", width: "100%" }}>
                <MapboxMap
                    accessToken="pk.eyJ1IjoibWVpbGxldXJzYWdlbnRzIiwiYSI6ImNqMWV5YnRpMDAwMHkyeXRnd3JkdXRiaDEifQ.emcFsn3Ox6WcKmOHhbTOPQ"
                    zoom="5"
                    mapboxStyle="mapbox://styles/meilleursagents/ckhf5i46501mv1apg8er3v1b1"
                    coordinates={{ lat: 46.227638, lng: -0.8930568 }}
                    onLoad={this.onMapLoad}
                    onClick={this.handleMapClick}
                >
                </MapboxMap>
                { this.state.colorScale &&
                    <Box component={Paper} className="ColorScaleContainer">
                        <TimerIcon />
                        <div className="ColorScaleStart">{"- de " + TimeHelper.hoursToTimeString(this.state.colorScale[1])}</div>
                        <Tooltip title={"moins de " + TimeHelper.hoursToTimeString(this.state.colorScale[1])}>
                            <div className="ColorScaleColor" style={{ "background-color": this.state.colorScale[0] }}></div>
                        </Tooltip>
                        <Tooltip title={"de " + TimeHelper.hoursToTimeString(this.state.colorScale[1]) + " à " + TimeHelper.hoursToTimeString(this.state.colorScale[3])}>
                            <div className="ColorScaleColor" style={{ "background-color": this.state.colorScale[2] }}></div>
                        </Tooltip>
                        <Tooltip title={"de " + TimeHelper.hoursToTimeString(this.state.colorScale[3]) + " à " + TimeHelper.hoursToTimeString(this.state.colorScale[5])}>
                            <div className="ColorScaleColor" style={{ "background-color": this.state.colorScale[4] }}></div>
                        </Tooltip>
                        <Tooltip title={"de " + TimeHelper.hoursToTimeString(this.state.colorScale[5]) + " à " + TimeHelper.hoursToTimeString(this.state.colorScale[7])}>
                            <div className="ColorScaleColor" style={{ "background-color": this.state.colorScale[6] }}></div>
                        </Tooltip>
                        <Tooltip title={"plus de " + TimeHelper.hoursToTimeString(this.state.colorScale[7])}>
                            <div className="ColorScaleColor" style={{ "background-color": this.state.colorScale[8] }}></div>
                        </Tooltip>
                        <div className="ColorScaleEnd">{"+ de " + TimeHelper.hoursToTimeString(this.state.colorScale[7])}</div>
                    </Box>
                }
            </div>
        )
    }
}

export default withRouter(Map);
