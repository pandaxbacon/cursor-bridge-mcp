type LogLevel = "debug" | "info" | "warn" | "error";

const levelPriority: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

function parseLogLevel(value: string | undefined): LogLevel {
  if (!value) {
    return "info";
  }
  if (value === "debug" || value === "info" || value === "warn" || value === "error") {
    return value;
  }
  return "info";
}

const activeLevel = parseLogLevel(process.env.LOG_LEVEL);

function shouldLog(level: LogLevel): boolean {
  return levelPriority[level] >= levelPriority[activeLevel];
}

function write(level: LogLevel, message: string, meta?: unknown): void {
  if (!shouldLog(level)) {
    return;
  }

  const payload = meta === undefined ? message : `${message} ${JSON.stringify(meta)}`;
  const line = `[cursor-bridge][${level}] ${payload}`;
  if (level === "error") {
    console.error(line);
    return;
  }
  console.error(line);
}

export const logger = {
  debug: (message: string, meta?: unknown) => write("debug", message, meta),
  info: (message: string, meta?: unknown) => write("info", message, meta),
  warn: (message: string, meta?: unknown) => write("warn", message, meta),
  error: (message: string, meta?: unknown) => write("error", message, meta),
};
