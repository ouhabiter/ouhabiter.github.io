import React, { Component } from 'react';
import TimeService from '../services/TimeService';

class City extends Component {
    render() {
        return (
            <div>
                <h1>{ this.props.station.city }</h1>
                Travel time: { TimeService.hoursToTimeString(this.props.station.travel_time) }<br/>
                Population: { this.props.station.population.toLocaleString() }
            </div>
        )
    }
}

export default City;