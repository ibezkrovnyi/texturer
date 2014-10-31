var cluster = require("cluster");

if (cluster.isMaster) {
	module.exports = require("./master.js");
} else {
	module.exports = require("./worker.js");
}
