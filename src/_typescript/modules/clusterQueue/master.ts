/// <reference path='../../../typings/node.d.ts' />
module ClusterQueue {

	var cluster = require("cluster"),
		os = require('os');

	class WorkerDescription {
		private _task : any;
		private _online : boolean;
		private _worker : any;

		constructor(callback, thisArg) {
			this._task = null;

			this._online = false;
			this._worker = cluster.fork();

			this._worker.on("message", (data) => {
				var task = this._task;
				if (task !== null) {
					this._task = null;

					// on error kill worker
					if (data.error) {
						this._worker.kill();
						this._online = false;
						this._worker = null;
					}
					callback.call(thisArg, this, task, data.error, data.taskResult);
				}
			});

			this._worker.on("online", (worker) => {
				// timeout is for debugging in JetBrains WebStorm. When running from command line, no delay is needed
				setTimeout(() => {
					this._online = true;
					if (this._task) {
						this._startTask();
					}
				}, 500);
			});

			this._worker.on("exit", (worker, code, signal) => {
				if (this._worker) {
					var task = this._task;
					if (task !== null) {
						this._task = null;
						callback.call(thisArg, this, task, new Error("MP: worker died. restarting..."), null);
					}
					this._online = false;
					this._worker = null;
				}
			});
		}

		public send(task) {
			if (this._task === null) {
				this._task = task;
				if (this._online) {
					this._startTask();
				}
			} else {
				console.error("ERROR: workerDescriptor can't send message. It is already busy");
			}
		}

		public kill() {
			var worker = this._worker;
			this._online = false;
			this._worker = null;

			worker.kill();
		}

		public _startTask() {
			this._worker.send(this._task.data);
		}
	}

	export class Master {
		static _instance : Master = null;

		private _shutdown : any;
		private _tasks : any[];
		private _availableWorkerDescriptors : any;
		private _busyWorkerDescriptors : any;
		private _maxSimultaneousTasks : any;

		constructor(options : any) {
			if (Master._instance !== null) {
				return Master._instance;
			}
			Master._instance = this;

			cluster.setupMaster({
				exec   : options.file,
				silent : true  // due to bug in node-webkit implementation silent=true is needed
			});

			this._shutdown = {callback : null, thisArg : null, scheduled : false};
			this._tasks = null;
			this._availableWorkerDescriptors = null;
			this._busyWorkerDescriptors = null;
			this._maxSimultaneousTasks = options.maxSimultaneousTasks || ((os.cpus().length * 1.5) | 0);
			this.restart();
		}

		public restart() {
			this._availableWorkerDescriptors = [];
			this._busyWorkerDescriptors = [];
			this._tasks = [];

			while (this._availableWorkerDescriptors.length < this._maxSimultaneousTasks) {
				this._availableWorkerDescriptors.push(new WorkerDescription(this._onMessage, this));
			}
		}

		public runTask(taskName, taskData, callback, thisArg) {
			// if worker not found - add to tasks
			this._tasks.push({
				callback : callback,
				thisArg  : thisArg,
				data     : {taskData : taskData, taskName : taskName}
			});

			this._tryToRunTask();
		}

		public shutdown(callback, thisArg) {
			this._shutdown.callback = callback;
			this._shutdown.thisArg = thisArg;
			this._shutdown.scheduled = true;

			this._tryToShutdown();
		}

		public abort() {
			// kill all available
			this._availableWorkerDescriptors.forEach(function (workerDescriptor : WorkerDescription) {
				workerDescriptor.kill();
			});
			this._availableWorkerDescriptors = null;

			// kill all busy too - we are aborting!
			this._busyWorkerDescriptors.forEach(function (workerDescriptor : WorkerDescription) {
				workerDescriptor.kill();
			});
			this._busyWorkerDescriptors = null;
		}

		private _tryToShutdown() {
			if (this._tasks.length === 0 && this._busyWorkerDescriptors.length === 0) {
				this._availableWorkerDescriptors.forEach(function (workerDescriptor : WorkerDescription) {
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
		}

		private _tryToRunTask() {
			if (this._tasks.length > 0) {
				var workerDescriptor = this._getAvailableWorkerDescriptor();
				if (workerDescriptor) {
					this._busyWorkerDescriptors.push(workerDescriptor);
					workerDescriptor.send(this._tasks.shift());
				}
			}
		}

		private _onMessage(workerDescriptor, task, error, taskResult) {
			var index = this._busyWorkerDescriptors.indexOf(workerDescriptor);
			if (index >= 0) {
				// reuse worker only if there was no error!
				if (!error) {
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
		}

		private _getAvailableWorkerDescriptor() {
			if (this._availableWorkerDescriptors.length === 0) {
				if (this._busyWorkerDescriptors.length < this._maxSimultaneousTasks) {
					this._availableWorkerDescriptors.push(new WorkerDescription(this._onMessage, this));
				}
			}

			return this._availableWorkerDescriptors.pop();
		}
	}

}
