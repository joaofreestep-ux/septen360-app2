type QueueJob = () => Promise<void>;

const queue: QueueJob[] = [];
let processing = false;

async function processQueue() {
  if (processing || queue.length === 0) return;

  processing = true;
  const job = queue.shift();

  try {
    if (job) {
      await job();
    }
  } catch (error) {
    console.error("Erro ao processar fila de videos:", error);
  } finally {
    processing = false;
    processQueue();
  }
}

export function addToProcessingQueue(job: QueueJob) {
  queue.push(job);
  processQueue();
}

export function getQueueStatus() {
  return {
    processing,
    pending: queue.length,
  };
}
