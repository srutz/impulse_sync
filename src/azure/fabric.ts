import { consola } from "consola";
import {
  AZURE_RESOURCE_FABRIC,
  AZURE_RESOURCE_STORAGE,
  getAccessToken,
} from "./accesstoken";
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
  // read file into binary buffer
  const buffer = await readBinaryFile(filePath);

  // Extract filename from path
  const filename = filePath.split('/').pop() || 'data.parquet';
  // OneLake DFS operations require a storage token, not a Fabric API token
  const accessToken = await getAccessToken(AZURE_RESOURCE_STORAGE);
  const baseUrl = `https://onelake.dfs.fabric.microsoft.com/${workspaceId}/${mirroredDatabaseId}/Files/LandingZone/${tableKey}/${filename}`;

  // Step 1: Create the file path
  //consola.info(`creating file path for ${tableKey}/${filename}`);
  const createResponse = await fetch(`${baseUrl}?resource=file`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "x-ms-version": "2020-02-10",
      "Content-Length": "0",
    },
  });

  if (!createResponse.ok) {
    throw new Error(
      `failed to create file: ${createResponse.status} ${await createResponse.text()}`,
    );
  }

  // Step 2: Append data to the file
  consola.info(`uploading ${buffer.length} bytes to ${tableKey}/${filename}`);
  const appendResponse = await fetch(`${baseUrl}?action=append&position=0`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "x-ms-version": "2020-02-10",
      "Content-Type": "application/octet-stream",
      "Content-Length": buffer.length.toString(),
    },
    body: buffer,
  });

  if (!appendResponse.ok) {
    throw new Error(
      `Failed to append data: ${appendResponse.status} ${await appendResponse.text()}`,
    );
  }

  // Step 3: Flush the file (finalize)
  //consola.info(`finalizing upload for ${tableKey}/${filename}`);
  const flushResponse = await fetch(
    `${baseUrl}?action=flush&position=${buffer.length}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "x-ms-version": "2020-02-10",
        "Content-Length": "0",
      },
    },
  );

  if (!flushResponse.ok) {
    throw new Error(
      `Failed to flush file: ${flushResponse.status} ${await flushResponse.text()}`,
    );
  }

  consola.success(`Successfully uploaded ${filename} to ${tableKey}`);
}
