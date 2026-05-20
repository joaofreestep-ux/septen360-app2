type Status = {
  progress: number;
  status: "processing" | "done" | "error";
};

const store = new Map<string, Status>();

export function setStatus(uuid: string, data: Status) {
  store.set(uuid, data);
}

export function getStatus(uuid: string): Status {
  return store.get(uuid) || { progress: 0, status: "processing" };
}
