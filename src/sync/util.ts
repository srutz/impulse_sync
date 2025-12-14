import { stat } from "node:fs/promises";

export async function isDirectory(path: string) {
  try {
    const stats = await stat(path);
    if (stats.isDirectory()) {
      return true;
    }
  } catch {
    // Doesn't exist
  }
  return false;
}

export async function isFile(path: string) {
  try {
    const stats = await stat(path);
    if (stats.isFile()) {
      return true;
    }
  } catch {
    // Doesn't exist
  }
  return false;
}