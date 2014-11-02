var cluster = require("cluster"),
	os      = require('os'),
	_this   = null;

function WorkerDescription (callback, thisArg) {
	var _this = this;

	this._task = null;

	this._online = false;
	this._worker = cluster.fork();

	this._worker.on("message", function (data) {
		var task = _this._task;
		if (task !== null) {
			_this._task = null;

			// on error kill worker
			if (data.error) {
				_this._worker.kill();
				_this._online = false;
				_this._worker = null;
			}
			callback.call(thisArg, _this, task, data.error, data.taskResult);
		}
	});

	this._worker.on("online", function (worker) {
		// timeout is for debugging in JetBrains WebStorm. When running from command line, no delay is needed
		setTimeout(function () {
			_this._online = true;
			if (_this._task) {
				_this._startTask();
			}
		}, 500);
	});

	this._worker.on("exit", function (worker, code, signal) {
		if (_this._worker) {
			var task = _this._task;
			if (task !== null) {
				_this._task = null;
				callback.call(thisArg, _this, task, new Error("MP: worker died. restarting..."), null);
			}
			_this._online = false;
			_this._worker = null;
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
		this._online = false;
		this._worker = null;

		worker.kill();
	},

	_startTask : function () {
		this._worker.send(this._task.data);
	}
};

function ClusterQueue (options) {
	if (_this !== null) {
		return _this;
	}
	_this = this;

	cluster.setupMaster({
		exec : options.file,
		silent : true  // due to bug in node-webkit implementation silent=true is needed
	});

	this._shutdown = {callback : null, thisArg : null, scheduled : false};
	this._tasks = null;
	this._availableWorkerDescriptors = null;
	this._busyWorkerDescriptors = null;
	this._maxSimultaneousTasks = options.maxSimultaneousTasks || ((os.cpus().length * 1.5) | 0);
	this.restart();
}

ClusterQueue.prototype = {
	restart : function() {
		this._availableWorkerDescriptors = [];
		this._busyWorkerDescriptors = [];
		this._tasks = [];

		while(this._availableWorkerDescriptors.length < this._maxSimultaneousTasks) {
			this._availableWorkerDescriptors.push(new WorkerDescription(this._onMessage, this));
		}
	},

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
			this._busyWorkerDescriptors = null;
			this._tasks = null;

			if (this._shutdown.callback) {
				this._shutdown.callback.call(this._shutdown.thisArg);
				this._shutdown.callback = null;
				this._shutdown.thisArg = null;
				this._shutdown.scheduled = false;
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
		var index = this._busyWorkerDescriptors.indexOf(workerDescriptor);
		if (index >= 0) {
			// reuse worker only if there was no error!
			if(!error) {
				this._availableWorkerDescriptors.push(this._busyWorkerDescriptors.splice(index, 1)[0]);
			} else {
				this._availableWorkerDescriptors.push(new WorkerDescription(this._onMessage, this));
			}
		} else {
			console.log("ERROR: workerDescriptor not found in busy list. Very strange!");
		}

		if (this._tasks.length > 0) {
			this._tryToRunTask();
		} else if (this._shutdown.scheduled) {
			this._tryToShutdown();
		}

		if (task.callback) {
			// callback may call shutdown, which will set busyWorkers to null,
			// so this line should the last in _onMessage method
			task.callback.call(task.thisArg, error, taskResult);
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
