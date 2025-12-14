import { consola } from "consola";
import { readFile, writeFile } from "node:fs/promises";
import { MARKERS_PATH } from "../paths";

export type SyncMarkers = {
  changedTs: string;
  markers: Record<string, string>;
};

let syncMarkers: SyncMarkers | null = null;

async function loadSyncMarkers(path: string) {
  try {
    const content = await readFile(path, "utf-8");
    if (!content || content.trim() === "") {
      // File is empty, return default structureok
      return {
        changedTs: new Date().toISOString(),
        markers: {},
      };
    }
    return JSON.parse(content) as SyncMarkers;
  } catch (error) {
    // If file doesn't exist or is corrupted, return default
    consola.warn(`Could not load sync markers from ${path}, using defaults`);
    return {
      changedTs: new Date().toISOString(),
      markers: {},
    };
  }
}

async function saveSyncMarkers(path: string, markers: SyncMarkers) {
  markers.changedTs = new Date().toISOString();
  const content = JSON.stringify(markers, null, 2);
  await writeFile(path, content, "utf-8");
}

async function getSyncMarker(tableKey: string) {
  if (!syncMarkers) {
    syncMarkers = await loadSyncMarkers(MARKERS_PATH);
  }
  return syncMarkers.markers[tableKey] || null;
}

async function setSyncMarker(tableKey: string, newMarker?: string | null) {
  if (!syncMarkers) {
    syncMarkers = await loadSyncMarkers(MARKERS_PATH);
  }
  if (newMarker === null || newMarker === undefined) {
    delete syncMarkers.markers[tableKey];
  } else {
    syncMarkers.markers[tableKey] = newMarker;
  }
  await saveSyncMarkers(MARKERS_PATH, syncMarkers);
}

async function showSyncMarkers() {
  if (!syncMarkers) {
    syncMarkers = await loadSyncMarkers(MARKERS_PATH);
  }
  consola.info("Current Sync Markers:");
  for (const [tableKey, marker] of Object.entries(syncMarkers.markers)) {
    consola.info(`- ${tableKey}: ${marker}`);
  }
}

export { showSyncMarkers, getSyncMarker, setSyncMarker };
