const superagent = require('superagent')

exports.httpGet = (url, cb) => {
    superagent.get(url)
        .end((resc, err) => {
            if (err) {
                console.log(err)
                cb('Request Error!')
            } else {
                let reuslt = resc.body
                cb(result.data)
            }
        })
}

exports.httpPost = (url, data, cb) => {
    superagent.post(url)
        .send(data)
        .end((resc, err) => {
            if (err) {
                console.log(err)
                cb('Request Error!')
            } else {
                let reuslt = resc.body
                cb(result.data)
            }
        })
}