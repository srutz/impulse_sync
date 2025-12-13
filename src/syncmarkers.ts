import { readFile, writeFile, mkdir, access } from "fs/promises";
import { MARKERS_PATH } from "./paths";
import { consola } from "consola";

export type SyncMarkers = {
  changedTs: string
  markers: Record<string, string>
}


let syncMarkers: SyncMarkers | null = null;

async function loadSyncMarkers(path: string) {
  const content = await readFile(path, "utf-8");
  return JSON.parse(content) as SyncMarkers;
}

async function saveSyncMarkers(path: string, markers: SyncMarkers) {
  markers.changedTs = new Date().toISOString();
  await writeFile(path, JSON.stringify(markers, null, 2), "utf-8");
}

async function getSyncMarker(tableKey: string) {
  syncMarkers = await loadSyncMarkers(MARKERS_PATH);
  return syncMarkers.markers[tableKey] || null;
}

async function setSyncMarker(tableKey: string, newMarker: string) {
  if (!syncMarkers) {
    throw new Error("Sync markers not loaded");
  }
  syncMarkers.markers[tableKey] = newMarker;
  consola.log("writing sync markers", MARKERS_PATH, syncMarkers);
  await saveSyncMarkers(MARKERS_PATH, syncMarkers);
}

export { getSyncMarker, setSyncMarker };
