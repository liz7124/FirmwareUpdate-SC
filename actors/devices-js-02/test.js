const rp = require('request-promise-native');

function main() {
    test = {
        Mid: 1
    };
    let options = {
        method: 'GET',
        uri: "http://192.168.0.24:8000/checknewfirmware",
        //uri: "http://localhost:8000/downloadnewfirmware",
        //uri: "http://localhost:8000/upgradefirmware",
        //body: {test},
        resolveWithFullResponse: true,
        json: true
    };
    rp(options).then(function (response) {
        console.log(response);
        console.log('Response status code: ', response.statusCode);
        console.log('Response body: ', response.body);
    }).catch(function(err) {
        console.log(err);
    });
}

main();