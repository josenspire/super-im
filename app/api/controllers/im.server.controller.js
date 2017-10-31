/**
 * Module dependencies
 */
let IMApiProxies = require('../proxies/im.server.proxies');

// user register
exports.userRegister = function (req, res) {
    IMApiProxies.get().queryVSETrade(req)
        .then(function (data) {
            res.json(data);
        }).catch(function (reason) {
            res.status(404).send({ message: new Error(reason).message });
        })

   
};

