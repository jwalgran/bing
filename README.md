# Bing - Call Bing web services from nodejs.

## About

This module was extracted from the TravelBoard project (http://github.com/jwalgran/travelboard). As a result
the current version only has support for searching for transit, walking or driving directions between 2 waypoints.

## Installation

From npm:

    npm install bing

From source:

    git clone git://github.com/jwalgran/bing.git 
    cd bing
    npm link

## Usage

    $ BING_MAPS_API_KEY=<your_bing_maps_api_key> node
    > var bing = require('bing');
    > bing.maps.getTransitRoute('100 market st, philadelphia', 
    ...'908 n 3rd st, philadelphia', function(err, resp) { if (!err) { console.dir(resp) } });
    > bing.maps.getWalkingRoute('100 market st, philadelphia',
    ...'908 n 3rd st, philadelphia', function(err, resp) { if (!err) { console.dir(resp) } });
    > bing.maps.getDrivingRoute('100 market st, philadelphia',
    ...'908 n 3rd st, philadelphia', function(err, resp) { if (!err) { console.dir(resp) } });
    
## Reference

The Bing Map REST API for routing:  
http://msdn.microsoft.com/en-us/library/ff701717.aspx
