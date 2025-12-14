import { homedir } from "node:os";
import { join } from "node:path";

const CONFIG_DIR = join(homedir(), ".impulse_sync");

const CONFIG_PATH = join(CONFIG_DIR, "config.json");
const MARKERS_PATH = join(CONFIG_DIR, "sync_markers.json");
const FILES_DIR = join(CONFIG_DIR, "files");
const AZURESTATE_PATH = join(CONFIG_DIR, "azure_state.json");

export { CONFIG_DIR, CONFIG_PATH, MARKERS_PATH, FILES_DIR, AZURESTATE_PATH };
