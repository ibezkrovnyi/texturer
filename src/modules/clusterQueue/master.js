var cluster = require("cluster"),
	os      = require('os'),
	_this   = null;

function WorkerDescription (callback, thisArg) {
	var _this = this;

	this._task = null;

	this._online = false;
	this._worker = cluster.fork();

	this._worker.on("message", function (data) {
		if (_this._task) {
			var task = _this._task;
			_this._task = null;

			//console.log("onmessage");
			if (data.error) {
				//console.log("onmessage error");
				_this._worker.kill();
				_this._online = false;
				_this._worker = cluster.fork();
			}
			//console.log("taks == null: " + (!task));
			callback.call(thisArg, _this, task, data.error, data.taskResult);
		}
	});

	this._worker.on("online", function (worker) {
		//console.log("worker ONLINE: ");
		setTimeout(function () {
			_this._online = true;
			if (_this._task) {
				_this._startTask();
			}
		}, 500);
		//if(_this._worker && !_this._online) {
		//}
	});

	this._worker.on("exit", function (worker, code, signal) {
		//console.log("onexit");
		if (_this._worker) {
			if (_this._task) {
				var task = _this._task;
				_this._task = null;
				//console.log("taks2 == null: " + (!task));
				callback.call(thisArg, _this, task, new Error("MP: worker died. restarting..."), null);
			}
			_this._online = false;
			_this._worker = cluster.fork();
		}
	});
}

WorkerDescription.prototype = {
	send : function (task) {
		if (this._task === null) {
			this._task = task;
			if (this._online) {
				this._startTask();
			}
		} else {
			console.error("ERROR: workerDescriptor can't send message. It is already busy");
		}
	},

	kill : function () {
		var worker = this._worker;
		this._worker = null;

		worker.kill();
	},

	_startTask : function () {
		var _this = this;
		//task = this._task;

		//setTimeout(function() {
		_this._worker.send(_this._task.data);
		_this = null;
		//}, 1000);
	}
};

function ClusterQueue (options) {
	if (_this !== null) {
		return _this;
	}
	_this = this;

	cluster.setupMaster({
		exec : options.file
	});

	this._shutdown = {callback : null, thisArg : null, scheduled : false};
	this._tasks = [];
	this._availableWorkerDescriptors = [];
	this._busyWorkerDescriptors = [];
	this._maxSimultaneousTasks = options.maxSimultaneousTasks || ((os.cpus().length * 1.5) | 0);

	for (var i = 0; i < this._maxSimultaneousTasks; i++) {
		this._availableWorkerDescriptors.push(new WorkerDescription(this._onMessage, this));
	}
}

ClusterQueue.prototype = {
	runTask : function (taskName, taskData, callback, thisArg) {
		// if worker not found - add to tasks
		this._tasks.push({
			callback : callback,
			thisArg  : thisArg,
			data     : { taskData : taskData, taskName : taskName }
		});

		this._tryToRunTask();
	},

	shutdown : function (callback, thisArg) {
		this._shutdown.callback = callback;
		this._shutdown.thisArg = thisArg;
		this._shutdown.scheduled = true;

		this._tryToShutdown();
	},

	abort : function () {
		// kill all available
		this._availableWorkerDescriptors.forEach(function (workerDescriptor) {
			workerDescriptor.kill();
		});
		this._availableWorkerDescriptors = null;

		// kill all busy too - we are aborting!
		this._busyWorkerDescriptors.forEach(function (workerDescriptor) {
			workerDescriptor.kill();
		});
		this._busyWorkerDescriptors = null;
	},

	_tryToShutdown : function () {
		if (this._tasks.length === 0 && this._busyWorkerDescriptors.length === 0) {
			this._availableWorkerDescriptors.forEach(function (workerDescriptor) {
				workerDescriptor.kill();
			});
			this._availableWorkerDescriptors = null;

			if (this._shutdown.callback) {
				this._shutdown.callback.call(this._shutdown.thisArg);
			}
		}
	},

	_tryToRunTask : function () {
		if (this._tasks.length > 0) {
			var workerDescriptor = this._getAvailableWorkerDescriptor();
			if (workerDescriptor) {
				this._busyWorkerDescriptors.push(workerDescriptor);
				workerDescriptor.send(this._tasks.shift());
			}
		}
	},

	_onMessage : function (workerDescriptor, task, error, taskResult) {
		//console.log("callback!");
		var index = this._busyWorkerDescriptors.indexOf(workerDescriptor);
		if (index >= 0) {
			this._availableWorkerDescriptors.push(this._busyWorkerDescriptors.splice(index, 1)[0]);
		} else {
			console.log("ERROR: workerDescriptor not found in busy list. Very strange!");
		}

		if (task.callback) {
			if (error) {
				console.log(error);
				console.log(error.toString());
			}
			task.callback.call(task.thisArg, error, taskResult);
		}

		if (this._tasks.length > 0) {
			this._tryToRunTask();
		} else if (this._shutdown.scheduled) {
			this._tryToShutdown();
		}
	},

	_getAvailableWorkerDescriptor : function () {
		if (this._availableWorkerDescriptors.length === 0) {
			if (this._busyWorkerDescriptors.length < this._maxSimultaneousTasks) {
				this._availableWorkerDescriptors.push(new WorkerDescription(this._onMessage, this));
			}
		}

		return this._availableWorkerDescriptors.pop();
	}
};

module.exports = ClusterQueue;
