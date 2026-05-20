type VideoProgressState = {
  progress: number;
  done: boolean;
  error?: string;
  updatedAt: number;
};

const progressMap = new Map<string, VideoProgressState>();

export function getVideoProgress(uuid: string): VideoProgressState {
  return (
    progressMap.get(uuid) ?? {
      progress: 0,
      done: false,
      updatedAt: Date.now(),
    }
  );
}

export function setVideoProgress(uuid: string, progress: number) {
  const current = getVideoProgress(uuid);
  progressMap.set(uuid, {
    ...current,
    progress: Math.max(0, Math.min(100, progress)),
    done: progress >= 100,
    updatedAt: Date.now(),
  });
}

export function setVideoDone(uuid: string) {
  progressMap.set(uuid, {
    progress: 100,
    done: true,
    updatedAt: Date.now(),
  });
}

export function setVideoError(uuid: string, error: string) {
  const current = getVideoProgress(uuid);
  progressMap.set(uuid, {
    ...current,
    error,
    done: false,
    updatedAt: Date.now(),
  });
}

export function clearVideoProgress(uuid: string) {
  progressMap.delete(uuid);
}
