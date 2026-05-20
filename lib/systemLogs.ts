import fs from "fs";
import path from "path";

type TechnicalLog = {
  message: string;
  time: string;
};

const logPath = path.join(process.cwd(), "data", "logs.json");

export function logError(message: string) {
  let logs: TechnicalLog[] = [];

  try {
    if (fs.existsSync(logPath)) {
      const raw = fs.readFileSync(logPath, "utf-8");
      const parsed = JSON.parse(raw);
      logs = Array.isArray(parsed) ? parsed : [];
    }

    logs.unshift({
      message,
      time: new Date().toISOString(),
    });

    fs.writeFileSync(logPath, JSON.stringify(logs.slice(0, 50), null, 2));
  } catch {
    // Avoid throwing while trying to log failures.
  }
}

export function getTechnicalLogs(): TechnicalLog[] {
  try {
    if (!fs.existsSync(logPath)) return [];

    const raw = fs.readFileSync(logPath, "utf-8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
