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
     * This URL fragment is concatenated with the `SERVICE_URL` to build
     * the full URL used to make requests for walking routes.
     * @type {String}
     * @private
     */
    WALKING_RESOURCE = 'Routes/Walking',

    /**
     * This URL fragment is concatenated with the `SERVICE_URL` to build
     * the full URL used to make requests for walking routes.
     * @type {String}
     * @private
     */
    DRIVING_RESOURCE = 'Routes/Driving',

    /**
     * Each application needs a distinct API key so this module expects a
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
        return SERVICE_URL + '/' + TRANSIT_RESOURCE + objectToQueryString(queryArgs);
    },

    /**
     * Build a URL by concatenating the specified `queryArgs` string with
     * a base URL to create a full URL to the walking route service.
     * @param {String} queryArgs A properly formatted query argument string
     * prefixed with '?'.
     * @private
     * returns String
     */
    createWalkingUrl = function(queryArgs) {
        return SERVICE_URL + '/' + WALKING_RESOURCE + objectToQueryString(queryArgs);
    },

    /**
     * Build a URL by concatenating the specified `queryArgs` string with
     * a base URL to create a full URL to the walking route service.
     * @param {String} queryArgs A properly formatted query argument string
     * prefixed with '?'.
     * @private
     * returns String
     */
    createDrivingUrl = function(queryArgs) {
        return SERVICE_URL + '/' + DRIVING_RESOURCE + objectToQueryString(queryArgs);
    },

    /**
     * Create a default hash of options for Bing Maps web service calls.
     *   - optimize = time
     *   - distanceUnit = mi (miles)
     *   - outputType = json
     * @private
     * returns Object
     */
    getDefaultOptions = function() {
        curTime = new Date();
        return {
            'optimize': 'time', // The Bing API can also accept 'distance' or 'timeWithTraffic'
            'distanceUnit': 'mi', // The Bing API can also accept 'km'
            'outputType': 'json' // The Bing API can also accept 'xml'
        };
    },

    /**
     * Create a default options hash specific to transit directions web service requests.
     *   - optimize = time
     *   - distanceUnit = mi (miles)
     *   - travelTime = current time in UTC
     *   - timeType = Departure
     *   - maxSolutionCount = 3
     *   - outputType = json
     * @private
     * returns Object
     */
    getDefaultTransitOptions = function() {
        var options = getDefaultOptions();
        options['travelTime'] = (curTime.getUTCMonth()+1) + "/" + curTime.getUTCDate() + "/" + curTime.getUTCFullYear() + " " + curTime.getUTCHours() + ":" + curTime.getUTCMinutes() + ":" + curTime.getUTCSeconds();
        options['timeType'] = 'Departure'; // The Bing API can also accept 'Arrival' or 'LastAvailable'
        options['maxSolutionCount'] =  3;
        return options;
    },

    /**
     * Create a default options hash specific to walking directions web service requests.
     *   - optimize = distance
     *   - distanceUnit = mi (miles)
     *   - outputType = json
     * @private
     * returns Object
     */
    getDefaultWalkingOptions = function() {
        var options = getDefaultOptions();
        options['optimize'] = 'distance';
        return options
    },

    /**
     * Create a default options hash specific to driving directions web service requests.
     *   - optimize = distance
     *   - distanceUnit = mi (miles)
     *   - outputType = json
     * @private
     * returns Object
     */
    getDefaultDrivingOptions = function() {
        var options = getDefaultOptions();
        options['optimize'] = 'time';
        return options
    },

    /**
     * Create an options hash that can be converted into query string arguments for appending
     * to a Bing Maps rest service URL. This function chandles converting more readable option
     * names like 'outputType' to 'o' and converting the specified startLocation and endLocation
     * to 'wp.0' and 'wp.1'.
     * @param {String} startLocation The starting address for the directions.
     * @param {String} endLocation The destination address for the directions.
     * @param {Object} a hash of key value options to be converted.
     * @private
     * returns Object
     */
    convertLocationsAndOptionsToQueryStringArgs = function(startLocation, endLocation, options) {
        var args = {
            'wp.0': startLocation,
            'wp.1': endLocation,
            'key': BING_MAPS_API_KEY,
            'o': options.outputType,
            'optmz': options.optimize,
            'du': options.distanceUnit
        };

        if (options.travelTime) {
            args['dt'] = options.travelTime;
        }

        if (options.timeType) {
            args['tt'] = options.timeType;
        }

        if (options.maxSolutionCount) {
            args['maxSolutions'] = options.maxSolutionCount;
        }

        return args;
    },

    /**
     * Make a request to the Bing maps API.
     * @param {String} url A Bing Maps REST API url with query string arguments.
     * @param {Function} callback The function to call when a response is received
     * from the Bing API or an error occurs.
     * @private
     */
    callBingApi = function(url, callback) {
        request(url, function (err, response, body) {
            if (!err && response.statusCode == 200) {
                if (callback) {
                    callback(undefined, JSON.parse(body));
                }
            }
            else {
                if (callback) {
                    callback(err, {"error": {"statusCode": response.statusCode, "body": JSON.parse(body)}});
                }
            }
        });
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
    var options = getDefaultTransitOptions(),
        queryStringArgs = convertLocationsAndOptionsToQueryStringArgs(startLocation, endLocation, options),
        requestUrl = createTransitUrl(queryStringArgs);
    callBingApi(requestUrl, callback);
}

/**
 * Make a request to the Bing maps API to get walking directions between
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
 * bing.maps.getWalkingRoute('100 N Broad St, Philadelphia','908 N 3rd St., Philadelphia', callback);
 *
 * @since 0.0.3
 */
exports.getWalkingRoute = function(startLocation, endLocation, callback) {
    var options = getDefaultWalkingOptions(),
        queryStringArgs = convertLocationsAndOptionsToQueryStringArgs(startLocation, endLocation, options),
        requestUrl = createWalkingUrl(queryStringArgs);
    callBingApi(requestUrl, callback);
}

/**
 * Make a request to the Bing maps API to get driving directions between
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
 * bing.maps.getDrivingRoute('100 N Broad St, Philadelphia','908 N 3rd St., Philadelphia', callback);
 *
 * @since 0.0.6
 */
exports.getDrivingRoute = function(startLocation, endLocation, callback) {
    var options = getDefaultDrivingOptions(),
        queryStringArgs = convertLocationsAndOptionsToQueryStringArgs(startLocation, endLocation, options),
        requestUrl = createDrivingUrl(queryStringArgs);
    callBingApi(requestUrl, callback);
}