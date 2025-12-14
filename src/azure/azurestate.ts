import { readFile, writeFile } from "node:fs/promises";
import { AZURESTATE_PATH } from "../paths";
import { isFile } from "../sync/util";

export type AzureState = {
  workspaceId: string | null;
  mirroredDatabaseId: string | null;
};

let azureState: AzureState | null = null;

export async function getAzureState() {
  if (!azureState) {
    azureState = await loadAzureState(AZURESTATE_PATH);
    if (!azureState) {
      azureState = {
        workspaceId: null,
        mirroredDatabaseId: null,
      };
    }
  }
  return azureState;
}

export async function setAzureState(state: AzureState) {
  azureState = state;
  await saveAzureState(AZURESTATE_PATH, state);
}

async function loadAzureState(path: string) {
  const exists = await isFile(path);
  if (!exists) {
    return null;
  }
  const content = await readFile(path, "utf-8");
  return JSON.parse(content) as AzureState;
}

async function saveAzureState(path: string, state: AzureState) {
  const content = JSON.stringify(state, null, 2);
  await writeFile(path, content, "utf-8");
}
