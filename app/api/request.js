let https = require('https');
let IMConfig = require('../../configs/config').IMConfig;
let fs = require('fs');
let fetch = require('node-fetch');

let host = IMConfig.host;
let org_name = IMConfig.org_name;
let app_name = IMConfig.app_name;

exports.httpRequest = function (json) {
    json = json || {};
    json.data = json.data || {};
    json.method = json.method || 'GET';
    json.headers = json.headers || {};
    json.query = json.query || {};

    let postData = JSON.stringify(json.data);
    // let ca = fs.readFileSync(IMConfig.ca, 'utf-8');

    //request parameters
    let options = {
        host: host,
        path: '/' + org_name + '/' + app_name + '/' + json.path,
        method: json.method,
        headers: json.headers,
        // ca: [ca],
        // ca: [],
        agent: false
    };
    //connect with query parameters
    if (json.query != null) {
        options.path += '?';
        for (let key in json.query) {
            if (json.query[key] != null) {
                options.path += key + '=' + json.query[key] + '&';
            }
        }
        options.path = options.path.substring(0, options.path.length - 1);
    }
    //send request
    let req = https.request(options, function (res) {
        let chunks = '';
        let size = 0;
        res.setEncoding('utf8');
        console.log('------------------------------request--------------------------------');
        console.log('host: ' + options.host + '\n' + 'path: ' + options.path + '\n' + 'method: ' + options.method);

        res.on('data', function (chunk) {
            chunks += chunk;
            size += chunk.length;
        });
        res.on('end', function () {
            //get response data
            console.log('------------------------------response--------------------------------');
            console.log('StatusCode: ' + res.statusCode);
            if (typeof json.callback == 'function')
                json.callback(chunks);
        });
    });
    //print error message
    req.on('error', function (e) {
        console.log('problem with request: ' + e.message);
    });

    // write data to request body
    req.write(postData);
    req.end();
};

exports.uploadFile = function (json) {
    json = json || {};
    json.data = json.data || {};
    json.method = json.method || 'POST';
    json.headers = json.headers || {};
    json.query = json.query || {};
    json.form = json.form || {};

    // let ca = fs.readFileSync(IMConfig.ca, 'utf-8');

    console.log('------------------------------request--------------------------------');
    console.log('host: ' + host + '\n' + 'path: ' + json.path + '\n' + 'method: ' + json.method);
    fetch('https://' + host + '/' + org_name + '/' + app_name + '/' + json.path, {
        method: json.method,
        body: json.form,
        headers: json.headers,
        // ca: [ca]
        // ca: []
    }).then(function (res) {
        console.log('------------------------------response--------------------------------');
        console.log('StatusCode: ' + res.status);
        return res.json();
    }).then(function (json) {
        console.log(json);
    }).catch(function (err) {
        console.log(err);
    });
};