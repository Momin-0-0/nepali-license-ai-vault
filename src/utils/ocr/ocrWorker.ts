
// OCR Worker for background processing to prevent UI blocking
export const createOCRWorker = () => {
  const workerCode = `
    importScripts('https://cdn.jsdelivr.net/npm/tesseract.js@6.0.1/dist/tesseract.min.js');
    
    self.onmessage = async function(e) {
      const { imageData, config, taskId } = e.data;
      
      try {
        const worker = await Tesseract.createWorker(['eng', 'nep']);
        await worker.setParameters(config.params);
        
        const { data } = await worker.recognize(imageData);
        
        self.postMessage({
          taskId,
          success: true,
          result: {
            text: data.text,
            confidence: data.confidence,
            words: data.words,
            lines: data.lines
          }
        });
        
        await worker.terminate();
      } catch (error) {
        self.postMessage({
          taskId,
          success: false,
          error: error.message
        });
      }
    };
  `;
  
  const blob = new Blob([workerCode], { type: 'application/javascript' });
  return new Worker(URL.createObjectURL(blob));
};

export class OCRTaskManager {
  private workers: Worker[] = [];
  private taskQueue: any[] = [];
  private activeTasks = new Map();
  
  constructor(maxWorkers = 2) {
    for (let i = 0; i < maxWorkers; i++) {
      this.workers.push(this.createWorker());
    }
  }
  
  private createWorker() {
    const worker = createOCRWorker();
    worker.onmessage = (e) => {
      const { taskId, success, result, error } = e.data;
      const task = this.activeTasks.get(taskId);
      
      if (task) {
        if (success) {
          task.resolve(result);
        } else {
          task.reject(new Error(error));
        }
        this.activeTasks.delete(taskId);
      }
    };
    return worker;
  }
  
  async processImage(imageData: any, config: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const taskId = Date.now() + Math.random();
      this.activeTasks.set(taskId, { resolve, reject });
      
      const availableWorker = this.workers.find(w => w);
      if (availableWorker) {
        availableWorker.postMessage({ imageData, config, taskId });
      } else {
        this.taskQueue.push({ imageData, config, taskId });
      }
    });
  }
  
  terminate() {
    this.workers.forEach(worker => worker.terminate());
    this.workers = [];
    this.activeTasks.clear();
  }
}
