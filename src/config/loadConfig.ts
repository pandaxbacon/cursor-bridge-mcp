import fs from "node:fs";
import path from "node:path";
import { bridgeConfigSchema, type BridgeConfig } from "./schema.js";

export const DEFAULT_CONFIG_FILE = "cursor-bridge.config.json";

export interface LoadedConfig {
  config: BridgeConfig;
  configPath: string | null;
}

export function loadConfig(cwd = process.cwd()): LoadedConfig {
  const configPath = path.join(cwd, DEFAULT_CONFIG_FILE);
  if (!fs.existsSync(configPath)) {
    return {
      config: bridgeConfigSchema.parse({}),
      configPath: null,
    };
  }

  const raw = fs.readFileSync(configPath, "utf8");
  const parsed = JSON.parse(raw) as unknown;
  return {
    config: bridgeConfigSchema.parse(parsed),
    configPath,
  };
}

export function resolveCdpPort(config: BridgeConfig, override?: number): number {
  if (override !== undefined) {
    return override;
  }

  const envPort = process.env.CURSOR_CDP_PORT;
  if (envPort) {
    const parsed = Number.parseInt(envPort, 10);
    if (!Number.isNaN(parsed) && parsed > 0 && parsed < 65536) {
      return parsed;
    }
  }

  return config.defaultPort;
}
