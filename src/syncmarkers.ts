import { readFile, writeFile, mkdir, access } from "fs/promises";
import { MARKERS_PATH } from "./paths";
import { consola } from "consola";

export type SyncMarkers = {
  changedTs: string
  markers: Record<string, string>
}


let syncMarkers: SyncMarkers | null = null;

async function loadSyncMarkers(path: string) {
  try {
    const content = await readFile(path, "utf-8");
    if (!content || content.trim() === "") {
      // File is empty, return default structure
      return {
        changedTs: new Date().toISOString(),
        markers: {}
      };
    }
    return JSON.parse(content) as SyncMarkers;
  } catch (error) {
    // If file doesn't exist or is corrupted, return default
    consola.warn(`Could not load sync markers from ${path}, using defaults`);
    return {
      changedTs: new Date().toISOString(),
      markers: {}
    };
  }
}

async function saveSyncMarkers(path: string, markers: SyncMarkers) {
  markers.changedTs = new Date().toISOString();
  const content = JSON.stringify(markers, null, 2);
  consola.log(`Saving sync markers to ${path}: ${content}`);
  await writeFile(path, content, "utf-8");
  consola.success(`Sync markers saved successfully to ${path}`);
}

async function getSyncMarker(tableKey: string) {
  if (!syncMarkers) {
    syncMarkers = await loadSyncMarkers(MARKERS_PATH);
  }
  return syncMarkers.markers[tableKey] || null;
}

async function setSyncMarker(tableKey: string, newMarker: string) {
  if (!syncMarkers) {
    syncMarkers = await loadSyncMarkers(MARKERS_PATH);
  }
  syncMarkers.markers[tableKey] = newMarker;
  consola.log("writing sync markers", MARKERS_PATH, syncMarkers);
  await saveSyncMarkers(MARKERS_PATH, syncMarkers);
}

export { getSyncMarker, setSyncMarker };
