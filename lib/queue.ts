import { Queue } from "bullmq";
import { redis } from "./redis";
import type { VideoJobData } from "./types";

export const videoQueue = new Queue<VideoJobData, boolean, string>("video", {
  connection: redis,

  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
    removeOnComplete: 20,
    removeOnFail: 50,
  },
});
