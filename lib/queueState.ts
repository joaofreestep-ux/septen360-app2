import fs from "fs";
import path from "path";

type QueueMeta = {
  lastProcessedAt: number;
};

const dataDir = path.join(process.cwd(), "data");
const queuePath = path.join(dataDir, "queue.json");
const metaPath = path.join(dataDir, "meta.json");

function ensureDataDir() {
  fs.mkdirSync(dataDir, { recursive: true });
}

function readJsonFile<T>(filePath: string, fallback: T): T {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJsonFile(filePath: string, data: unknown) {
  ensureDataDir();
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

export function addQueueItem(uuid: string) {
  const queue = readJsonFile<string[]>(queuePath, []);
  queue.push(uuid);
  writeJsonFile(queuePath, queue);
}

export function removeQueueItem(uuid: string) {
  const queue = readJsonFile<string[]>(queuePath, []);
  const nextQueue = queue.filter((item) => item !== uuid);
  writeJsonFile(queuePath, nextQueue);
}

export function touchLastProcessedAt() {
  const meta: QueueMeta = {
    lastProcessedAt: Date.now(),
  };
  writeJsonFile(metaPath, meta);
}

export function getQueueSnapshot() {
  const queue = readJsonFile<string[]>(queuePath, []);
  const meta = readJsonFile<QueueMeta>(metaPath, { lastProcessedAt: 0 });

  return {
    queueSize: Array.isArray(queue) ? queue.length : 0,
    lastProcessedAt: Number(meta?.lastProcessedAt ?? 0),
    now: Date.now(),
  };
}
