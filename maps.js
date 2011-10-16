var request = require('request'),

    SERVICE_URL = 'http://dev.virtualearth.net/REST/v1',
    TRANSIT_RESOURCE = 'Routes/Transit',
    BING_MAPS_API_KEY = process.env.BING_MAPS_API_KEY,
    
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
    
    createTransitUrl = function(queryArgs) {
        return SERVICE_URL + '/' + TRANSIT_RESOURCE + objectToQueryString(queryArgs)
    };

exports.getTransitRoute = function(startLocation, endLocation, callback) {
    var curTime = new Date(),
        
        options = {
            'optimize': 'time', 
            'distanceUnit': 'mi', 
            'travelTime': curTime.getHours() + ":" + curTime.getMinutes() + ":" + curTime.getSeconds(),
            'timeType': 'Departure',
            'maxSolutionCount': 3,
            'outputType': 'json'
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