import { stat } from "fs/promises";

export async function isDirectory(path: string): Promise<boolean> {
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