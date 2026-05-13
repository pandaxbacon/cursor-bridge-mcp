import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { loadConfig, resolveCdpPort } from "../../src/config/loadConfig.js";

describe("loadConfig", () => {
  it("loads defaults when file is missing", () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "cursor-bridge-config-"));
    const { config, configPath } = loadConfig(tmp);
    expect(config.defaultPort).toBe(9222);
    expect(config.aliases).toEqual({});
    expect(configPath).toBeNull();
  });

  it("loads aliases from config file", () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "cursor-bridge-config-"));
    const configPath = path.join(tmp, "cursor-bridge.config.json");
    fs.writeFileSync(
      configPath,
      JSON.stringify({
        defaultPort: 9333,
        aliases: {
          demo: {
            workspacePath: "/tmp/demo",
          },
        },
      }),
    );
    const { config } = loadConfig(tmp);
    expect(config.defaultPort).toBe(9333);
    expect(config.aliases.demo?.workspacePath).toBe("/tmp/demo");
    expect(resolveCdpPort(config)).toBe(9333);
  });
});
