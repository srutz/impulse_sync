import { consola } from "consola";
import { AZURE_RESOURCE_FABRIC, getAccessToken } from "./accesstoken";
import { getAzureState, setAzureState } from "./azurestate";
import { readBinaryFile } from "../sync/util";

export type Workspace = {
  id: string;
  displayName: string;
  description: string;
  type: string;
  capacityId?: string | null;
};

export async function getWorkspaces() {
  const response = await fetch(
    "https://api.fabric.microsoft.com/v1/workspaces",
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${await getAccessToken(AZURE_RESOURCE_FABRIC)}`,
        "Content-Type": "application/json",
      },
    },
  );
  const data = (await response.json()) as { value: Workspace[] };
  return data;
}

export async function setWorkspace(workspaceId: string) {
  const state = await getAzureState();
  state.workspaceId = workspaceId;
  // Save the updated state
  await setAzureState(state);
}

export async function getWorkspace() {
  const state = await getAzureState();
  return state.workspaceId;
}

export async function getMirroredDatabases() {
  const state = await getAzureState();
  const workspaceId = state.workspaceId;
  if (!workspaceId) {
    throw new Error("workspaceId is not set. Please set the workspace first.");
  }
  const response = await fetch(
    `https://api.fabric.microsoft.com/v1/workspaces/${workspaceId}/mirroredDatabases`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${await getAccessToken(AZURE_RESOURCE_FABRIC)}`,
        "Content-Type": "application/json",
      },
    },
  );
  const data = await response.json();
  return data;
}

export async function setMirroredDatabase(mirroredDatabaseId: string) {
  const state = await getAzureState();
  state.mirroredDatabaseId = mirroredDatabaseId;
  // Save the updated state
  await setAzureState(state);
}

export async function getMirroredDatabase() {
  const state = await getAzureState();
  return state.mirroredDatabaseId;
}

export async function uploadTableFile(tableKey: string, filePath: string) {
  const state = await getAzureState();
  const workspaceId = state.workspaceId;
  const mirroredDatabaseId = state.mirroredDatabaseId;
  if (!workspaceId || !mirroredDatabaseId) {
    throw new Error(
      "workspaceId or mirroredDatabaseId is not set. Please set them first.",
    );
  }
  const url = `https://api.fabric.microsoft.com/v1/workspaces/${workspaceId}/mirroredDatabases/${mirroredDatabaseId}/tables/${tableKey}/uploadFile`;
  // read file into binary buffer
  const buffer = await readBinaryFile(filePath);


  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${await getAccessToken(AZURE_RESOURCE_FABRIC)}`,
    },
    body: fileStream,
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to upload table file: ${response.status} ${response.statusText} - ${errorText}`,
    );
  } else {
    consola.info(`uploaded file "${tableKey}" : "${filePath}" successfully.`);
  }
}
