const env = process.env.NODE_ENV || "development";
let config;
try {
  config = require("./" + env);
} catch (error) {
  console.log(error);
}
module.exports = config;