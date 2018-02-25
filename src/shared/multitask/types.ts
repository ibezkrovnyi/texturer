export interface MultiTaskMasterTask {
  getFile(): string;
  getWorkerData(): string | Object;
  onData(error: string | null, data: any): void;
}
