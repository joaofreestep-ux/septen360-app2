import fs from "fs";
import path from "path";

export type AppConfig = {
  is_monetized: boolean;
  public_base_url: string;
};

const defaultConfig: AppConfig = {
  is_monetized: false,
  public_base_url: "",
};

const filePath = path.join(process.cwd(), "data", "config.json");

export function readConfig(): AppConfig {
  if (!fs.existsSync(filePath)) {
    writeConfig(defaultConfig);
    return defaultConfig;
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    return {
      ...defaultConfig,
      ...parsed,
      public_base_url: typeof parsed.public_base_url === "string" ? parsed.public_base_url : "",
    };
  } catch {
    writeConfig(defaultConfig);
    return defaultConfig;
  }
}

export function writeConfig(config: AppConfig) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(filePath, JSON.stringify(config, null, 2));
}
