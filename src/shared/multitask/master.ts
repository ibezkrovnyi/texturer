import { MultiTaskMasterTask } from './types';

var child_process = require("child_process"),
  os = require('os'),
  path = require("path");

let debugPort = 0;
for (const arg of (<any>process).execArgv) {
  const p = arg.split("=");
  if (p[ 0 ] === "--debug-brk") {
    debugPort = parseInt(p[ 1 ], 10) + 1;
  }
}

class ForkContainer {
  private _task: MultiTaskMasterTask | null;
  private _online: boolean;
  private _worker: any;
  private _callback: (forkContainer: ForkContainer, task: MultiTaskMasterTask, error: string, data: any) => void;
  private _thisArg: Object;
  private _tasksFolder: string;

  constructor(tasksFolder: string, callback: (forkContainer: ForkContainer, task: MultiTaskMasterTask, error: string, data: any) => void, thisArg: any) {
    this._tasksFolder = tasksFolder;
    this._callback = callback;
    this._thisArg = thisArg;
    this._task = null;
    this._online = false;
  }

  send(task: MultiTaskMasterTask) {
    this._fork(path.join(this._tasksFolder, task.getFile()));

    if (this._task === null) {
      this._task = task;
      if (this._online) {
        this._startTask();
      }
    } else {
      console.error("ERROR: workerDescriptor can't send message. It is already busy");
    }
  }

  kill() {
    var worker = this._worker;
    if (worker) {
      this._online = false;
      this._worker = null;
      worker.kill();
    }
  }

  private _startTask() {
    this._worker.send(this._task!.getWorkerData());
  }

  private _fork(file: string): void {
    if (!this._worker) {

      this._worker = child_process.fork(
        file,
        { execArgv: debugPort ? [ `--debug-brk=${debugPort++}` ] : [] }
      );

      this._worker.on("message", (data: any) => {
        switch (data) {
          case "online":
            // timeout is for debugging in JetBrains WebStorm. When running from command line, no delay is needed
            //setTimeout(() => {
            this._online = true;
            if (this._task) {
              this._startTask();
            }
            //}, 500);
            break;

          default:
            var task = this._task;
            if (task !== null) {
              this._task = null;

              // on error kill worker
              if (data.error) {
                this.kill();
              }
              this._callback.call(this._thisArg, this, task, data.error, data.data);
            }
            break;
        }
      });
    }
  }
}

export class MultiTaskMaster {
  private _shutdown: { callback: (() => void) | null; scheduled: boolean };
  private _tasks: MultiTaskMasterTask[];
  private _availableForkContainers: { [workerTaskFile: string]: ForkContainer[] } | null;
  private _busyForkContainers: { [workerTaskFile: string]: ForkContainer[] } | null;
  private _maxSimultaneousTasks: number;
  private _busyForkContainersCount: number;
  private _tasksFolder: string;

  constructor(tasksFolder: string, maxSimultaneousTasks: number = os.cpus().length) {
    this._tasksFolder = tasksFolder;
    this._shutdown = { callback: null, scheduled: false };
    this._tasks = [];
    this._availableForkContainers = null;
    this._busyForkContainers = null;
    this._busyForkContainersCount = 0;
    this._maxSimultaneousTasks = maxSimultaneousTasks;
    this.restart();
  }

  restart() {
    this._availableForkContainers = {};
    this._busyForkContainers = {};
    this._tasks = [];
  }

  runTask(task: MultiTaskMasterTask) {
    // if worker not found - add to tasks
    this._prepareForTask(task);
    this._tasks.push(task);

    this._tryToRunTask();
  }

  shutdown(callback: any) {
    this._shutdown.callback = callback;
    this._shutdown.scheduled = true;

    this._tryToShutdown();
  }

  abort() {
    // kill all available
    Object.keys(this._availableForkContainers!).forEach(key => {
      this._availableForkContainers![ key ].forEach(function (workerDescriptor: ForkContainer) {
        workerDescriptor.kill();
      });
    });
    this._availableForkContainers = null;

    // kill all busy too - we are aborting!
    Object.keys(this._busyForkContainers!).forEach(key => {
      this._busyForkContainers![ key ].forEach(function (workerDescriptor: ForkContainer) {
        workerDescriptor.kill();
      });
    });
    this._busyForkContainers = null;
  }

  private _tryToShutdown() {
    // find any busy worker descriptor
    var hasBusyWorkers = false;
    Object.keys(this._busyForkContainers!).forEach(key => {
      if (this._busyForkContainers![ key ].length > 0) hasBusyWorkers = true;
    });

    if (this._tasks.length === 0 && !hasBusyWorkers) {
      this.abort();
      this._tasks = null!;
      this._shutdown.scheduled = false;

      const callback = this._shutdown.callback;
      if (callback) {
        this._shutdown.callback = null;
        callback();
      }
    }
  }

  private _tryToRunTask() {
    if (this._tasks.length > 0) {

      const task = this._tasks[ 0 ],
        forkContainer = this._getAvailableForkContainer(task);

      if (forkContainer) {
        this._tasks.shift();
        this._busyForkContainers![ task.getFile() ].push(forkContainer);
        forkContainer.send(task);
        this._busyForkContainersCount++;
      }

    }
  }

  private _onMessage(forkContainer: ForkContainer, task: MultiTaskMasterTask, error: string, taskResult: any) {
    const taskName = task.getFile(),
      index = this._busyForkContainers![ taskName ].indexOf(forkContainer);

    if (index >= 0) {
      // remove from busyWorkers
      this._busyForkContainers![ taskName ].splice(index, 1);

      // reuse worker only if there was no error!
      if (!error) {
        this._availableForkContainers![ taskName ].push(forkContainer);
      }
      this._busyForkContainersCount--;
    } else {
      console.log("ERROR: forkContainer not found in busy list. Very strange!");
    }

    if (this._tasks.length > 0) {
      this._tryToRunTask();
    } else if (this._shutdown.scheduled) {
      this._tryToShutdown();
    }

    // callback may call shutdown, which will set busyWorkers to null,
    // so this line should the last in _onMessage method
    task.onData(error, taskResult);
  }

  private _getAvailableForkContainer(task: MultiTaskMasterTask) {
    const taskName = task.getFile();

    if (this._busyForkContainersCount < this._maxSimultaneousTasks) {
      if (this._availableForkContainers![ taskName ].length === 0) {

        let forkContainer = new ForkContainer(this._tasksFolder, this._onMessage, this);
        this._availableForkContainers![ taskName ].push(forkContainer);
      }
      return this._availableForkContainers![ taskName ].pop();
    }

    return null;
  }

  private _prepareForTask(task: MultiTaskMasterTask): void {
    const taskName = task.getFile();
    if (!this._availableForkContainers!.hasOwnProperty(taskName)) {
      this._availableForkContainers![ taskName ] = [];
    }

    if (!this._busyForkContainers!.hasOwnProperty(taskName)) {
      this._busyForkContainers![ taskName ] = [];
    }
  }
}
