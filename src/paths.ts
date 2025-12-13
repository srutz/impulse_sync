import { homedir } from "node:os";
import { join } from "node:path";

const CONFIG_DIR = join(homedir(), ".impulse_sync");
const CONFIG_PATH = join(CONFIG_DIR, "config.json");
const MARKERS_PATH = join(CONFIG_DIR, "sync_markers.json");

export { CONFIG_DIR, CONFIG_PATH, MARKERS_PATH };
