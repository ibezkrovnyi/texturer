module ClusterQueue {

	export var Master = null;
	export var Worker = null;

	var cluster = require("cluster");

	if (cluster.isMaster) {
		master = require("./master.js");
	} else {
		worker = require("./worker.js");
	}

	export var
}
