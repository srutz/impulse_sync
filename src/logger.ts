import { appendFile } from "node:fs/promises";
import { consola as consola_ } from "consola";
import type { Config } from "./config";

let logFilePath: string | null = null;

export function initLogger(config: Config) {
  logFilePath = config.logFilePath || null;
  consola_.info("Logger initialized. Log file path:", logFilePath);
  if (logFilePath) {
    consola_.info(`Logging to file: ${logFilePath}`);
  }
}

async function writeToFile(level: string, ...args: unknown[]) {
  if (!logFilePath) return;

  try {
    const timestamp = new Date().toISOString();
    const message = args
      .map((arg) =>
        typeof arg === "object" ? JSON.stringify(arg) : String(arg),
      )
      .join(" ");
    const logLine = `[${timestamp}] [${level.toUpperCase()}] ${message}\n`;
    await appendFile(logFilePath, logLine, "utf-8");
  } catch (error) {
    // If we can't write to the log file, just log to console
    consola_.error("Failed to write to log file:", error);
  }
}

export const logger = {
  log: (...args: unknown[]) => {
    // biome-ignore lint/suspicious/noExplicitAny: consola accepts any arguments
    (consola_.log as any)(...args);
    writeToFile("log", ...args).catch(() => { });
  },
  info: (...args: unknown[]) => {
    // biome-ignore lint/suspicious/noExplicitAny: consola accepts any arguments
    (consola_.info as any)(...args);
    writeToFile("info", ...args).catch(() => { });
  },
  success: (...args: unknown[]) => {
    // biome-ignore lint/suspicious/noExplicitAny: consola accepts any arguments
    (consola_.success as any)(...args);
    writeToFile("success", ...args).catch(() => { });
  },
  warn: (...args: unknown[]) => {
    // biome-ignore lint/suspicious/noExplicitAny: consola accepts any arguments
    (consola_.warn as any)(...args);
    writeToFile("warn", ...args).catch(() => { });
  },
  error: (...args: unknown[]) => {
    // biome-ignore lint/suspicious/noExplicitAny: consola accepts any arguments
    (consola_.error as any)(...args);
    writeToFile("error", ...args).catch(() => { });
  },
  fail: (...args: unknown[]) => {
    // biome-ignore lint/suspicious/noExplicitAny: consola accepts any arguments
    (consola_.fail as any)(...args);
    writeToFile("fail", ...args).catch(() => { });
  },
};

export const consola = logger;
