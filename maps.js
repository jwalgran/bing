/**
 * bing - maps
 * Copyright (C) 2011 Justin Walgran
 * MIT Licensed
 */

/**
 * This module uses the request module as a high level API for consuming the
 * Bing REST services.
 * @private
 */
var request = require('request'),

    /**
     * The base URL for Bing services is cached in a variable so it is not
     * repeated thoughout the module code.
     * @type {String}
     * @private
     */
    SERVICE_URL = 'http://dev.virtualearth.net/REST/v1',

    /**
     * This URL fragment is concatenated with the `SERVICE_URL` to build
     * the full URL used to make requests for transit routes.
     * @type {String}
     * @private
     */
    TRANSIT_RESOURCE = 'Routes/Transit',

    /**
     * Each application needs a distict API key so this module expects a
     * `BING_MAPS_API_KEY` environment variable to be defined.
     * @type {String}
     * @private
     */
    BING_MAPS_API_KEY = process.env.BING_MAPS_API_KEY,

    /**
     * Treat the specified `obj` object as a flat collection of key-value pairs
     * and convert it to a query string prefixed with ? and ready to be concatenated
     * with a URL.
     * @param {Object} obj The object to be converted into a query string.
     * @private
     * returns String
     */
    objectToQueryString = function(obj) {
        if (obj) {
            var args = [];
            for(var key in obj)
                args.push(key + '=' + encodeURIComponent(obj[key]));
            return '?' + args.join('&');
        }
        else {
            return '';
        }
    },
    
    /**
     * Build a URL by concatenating the specified `queryArgs` string with
     * a base URL to create a full URL.
     * @param {String} queryArgs A properly formatted query argument string
     * prefixed with '?'.
     * @private
     * returns String
     */
    createTransitUrl = function(queryArgs) {
        return SERVICE_URL + '/' + TRANSIT_RESOURCE + objectToQueryString(queryArgs)
    };

/**
 * Make a request to the Bing maps API to get transit directions between
 * two addresses.
 * @public
 * @param {String} startLocation The starting address for the directions.
 * @param {String} endLocation The destination address for the directions.
 * @param {Function} callback The function to call when a response is received
 * from the Bing API or an error occurs.
 *
 * If the request to the Bing API returns an error, or a non 200 response code
 * the the specified callback will be invoked with the an error object as the
 * first parameter.
 * @example {"error":{
 *     "statusCode": <The HTTP code returned from the Bing API request>,
 *     "body": <The raw text response returned from the Bing API>
 * }}
 *
 * @example var callback = function(err, obj) {
 *     if(!err) {
 *         // Process the response object, which was created by parsing the JSON
 *         // returned from the Bing API.
 *     } else {
 *         // Handle the error.
 *     }
 * };
 * bing.maps.getTransitRoute('100 N Broad St, Philadelphia','908 N 3rd St., Philadelphia', callback);
 *
 * @since 0.0.1
 */
exports.getTransitRoute = function(startLocation, endLocation, callback) {
    var curTime = new Date(),
        
        options = {
            'optimize': 'time', // The Bing API can also accept 'distance' or 'timeWithTraffic'
            'distanceUnit': 'mi', // The Bing API can also accept 'km'
            'travelTime': curTime.getUTCHours() + ":" + curTime.getUTCMinutes() + ":" + curTime.getUTCSeconds(),
            'timeType': 'Departure', // The Bing API can also accept 'Arrival' or 'LastAvailable'
            'maxSolutionCount': 3,
            'outputType': 'json' // The Bing API can also accept 'xml'
        },
        
        queryStringArgs = {
            'wp.0': startLocation,
            'wp.1': endLocation,
            'key': BING_MAPS_API_KEY,
            'o': options.outputType,
            'optmz': options.optimize,
            'du': options.distanceUnit,
            'dt': options.travelTime,
            'tt': options.timeType,
            'maxSolutions': options.maxSolutionCount
        },
        
        requestUrl = createTransitUrl(queryStringArgs);

    request(requestUrl, function (err, response, body) {
        if (!err && response.statusCode == 200) {
            if (callback) {
                callback(undefined, JSON.parse(body));
            }
        }
        else {
            if (callback) {
                callback(err, {"error": {"statusCode": response.statusCode, "body": body}});
            }
        }
    });
}