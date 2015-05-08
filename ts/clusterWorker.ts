/*
 * Project: Texturer
 *
 * User: Igor Bezkrovny
 * Date: 18.10.2014
 * Time: 19:36
 * MIT LICENSE
 */
module ClusterQueue {
	var taskHandlers = {};

	process.on("message", function (data) {
		var taskName = data["taskName"],
			taskData = data["taskData"];

		if (typeof taskHandlers[taskName] !== 'undefined') {
			try {
				taskHandlers[taskName].taskHandler.call(taskHandlers[taskName].thisArg, taskData);
			} catch (e) {
				sendResult("worker: error in task " + taskName + ": " + e);
			}
		} else {
			sendResult("worker: taskHandler for task " + taskName + " is not defined.");
		}
	});

	function sendResult(error, taskResult? : any) {
		process.send({error : error, taskResult : taskResult});
	}

	/**
	 * @param {string} taskName
	 * @param {function(this:T, taskData : *):void} taskHandler
	 * @param {T} thisArg
	 * @template T
	 */
	export function registerTask(taskName, taskHandler, thisArg) {
		taskHandlers[taskName] = {
			taskHandler : taskHandler,
			thisArg     : thisArg
		}
	}

	/**
	 * @param {string} error
	 * @param {*} taskResult
	 */
	export function send(error, taskResult) {
		sendResult(error, taskResult);
	}
}
