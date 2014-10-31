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

function sendResult (error, taskResult) {
	process.send({error : error, taskResult : taskResult});
}

module.exports = {

	/**
	 * @param {string} taskName
	 * @param {function(this:T, taskData : *):void} taskHandler
	 * @param {T} thisArg
	 * @template T
	 */
	registerTask : function (taskName, taskHandler, thisArg) {
		taskHandlers[taskName] = {
			taskHandler : taskHandler,
			thisArg     : thisArg
		}
	},

	/**
	 * @param {string} error
	 * @param {*} taskResult
	 */
	send : function (error, taskResult) {
		sendResult(error, taskResult);
	}
};
