import * as path from "node:path";
import { consola } from "../logger";
import { readBinaryFile } from "../sync/util";
import {
  AZURE_RESOURCE_FABRIC,
  AZURE_RESOURCE_STORAGE,
  getAccessToken,
} from "./accesstoken";
import { getAzureState, setAzureState } from "./azurestate";

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
  consola.info(`Starting upload: table=${tableKey}, file=${filePath}`);

  const state = await getAzureState();
  const workspaceId = state.workspaceId;
  const mirroredDatabaseId = state.mirroredDatabaseId;

  consola.info(`Workspace ID: ${workspaceId}`);
  consola.info(`Mirrored Database ID: ${mirroredDatabaseId}`);

  if (!workspaceId || !mirroredDatabaseId) {
    throw new Error(
      "workspaceId or mirroredDatabaseId is not set. Please set them first.",
    );
  }

  // read file into binary buffer
  consola.info(`Reading file: ${filePath}`);
  const buffer = await readBinaryFile(filePath);
  consola.info(`File read successfully: ${buffer.length} bytes`);

  // Extract filename from path (works on both Unix and Windows)
  const filename = path.basename(filePath);
  consola.info(`Filename extracted: ${filename}`);

  // OneLake DFS operations require a storage token, not a Fabric API token
  consola.info("Acquiring Azure Storage access token...");
  const accessToken = await getAccessToken(AZURE_RESOURCE_STORAGE);
  consola.info("Access token acquired successfully");

  const baseUrl = `https://onelake.dfs.fabric.microsoft.com/${workspaceId}/${mirroredDatabaseId}/Files/LandingZone/${tableKey}/${filename}`;
  consola.info(`Target URL: ${baseUrl}`);

  // do this a few times, since there could be timeouts for large files
  const attempts = 10;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    consola.info(`Upload attempt ${attempt}/${attempts}`);
    try {
      // Step 1: Create the file path
      consola.info(`Step 1: Creating file path for ${tableKey}/${filename}`);
      const createResponse = await fetch(`${baseUrl}?resource=file`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "x-ms-version": "2020-02-10",
          "Content-Length": "0",
        },
      });

      consola.info(`Create response: ${createResponse.status} ${createResponse.statusText}`);
      if (!createResponse.ok) {
        const errorText = await createResponse.text();
        consola.error(`Create file failed with status ${createResponse.status}`);
        consola.error(`Response headers: ${JSON.stringify(Object.fromEntries(createResponse.headers))}`);
        consola.error(`Response body: ${errorText}`);
        throw new Error(
          `failed to create file: ${createResponse.status} ${errorText}`,
        );
      }
      consola.success("File path created successfully");

      // Step 2: Append data to the file
      consola.info(
        `Step 2: Uploading ${buffer.length} bytes to ${tableKey}/${filename}`,
      );
      const appendResponse = await fetch(
        `${baseUrl}?action=append&position=0`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "x-ms-version": "2020-02-10",
            "Content-Type": "application/octet-stream",
            "Content-Length": buffer.length.toString(),
          },
          body: buffer,
        },
      );

      consola.info(`Append response: ${appendResponse.status} ${appendResponse.statusText}`);
      if (!appendResponse.ok) {
        const errorText = await appendResponse.text();
        consola.error(`Append data failed with status ${appendResponse.status}`);
        consola.error(`Response headers: ${JSON.stringify(Object.fromEntries(appendResponse.headers))}`);
        consola.error(`Response body: ${errorText}`);
        throw new Error(
          `failed to append data: ${appendResponse.status} ${errorText}`,
        );
      }
      consola.success(`Data appended successfully: ${buffer.length} bytes`);

      // Step 3: Flush the file (finalize)
      consola.info(`Step 3: Finalizing upload for ${tableKey}/${filename}`);
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

      consola.info(`Flush response: ${flushResponse.status} ${flushResponse.statusText}`);
      if (!flushResponse.ok) {
        const errorText = await flushResponse.text();
        consola.error(`Flush file failed with status ${flushResponse.status}`);
        consola.error(`Response headers: ${JSON.stringify(Object.fromEntries(flushResponse.headers))}`);
        consola.error(`Response body: ${errorText}`);
        throw new Error(
          `Failed to flush file: ${flushResponse.status} ${errorText}`,
        );
      }
      consola.success("File flushed (finalized) successfully");

      consola.success(`Upload completed successfully on attempt ${attempt}`);
      break; // success, exit loop
    } catch (error) {
      consola.error(`Attempt ${attempt} failed:`, error);
      if (attempt === attempts) {
        consola.error(`All ${attempts} attempts exhausted. Upload failed.`);
        throw new Error(
          `failed to upload file after ${attempts} attempts: ${error}`,
        );
      }
      const delay = attempt * 2000; // exponential backoff
      consola.warn(`Attempt ${attempt} failed, retrying in ${delay}ms...`);
      consola.warn(`Error details: ${error}`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  consola.success(`✓ Upload complete: ${filename} to ${tableKey}`);
}

/**
 * Checks if _metadata.json exists for the given table
 */
export async function metadataExists(tableKey: string): Promise<boolean> {
  const state = await getAzureState();
  const workspaceId = state.workspaceId;
  const mirroredDatabaseId = state.mirroredDatabaseId;
  if (!workspaceId || !mirroredDatabaseId) {
    throw new Error(
      "workspaceId or mirroredDatabaseId is not set. Please set them first.",
    );
  }

  const accessToken = await getAccessToken(AZURE_RESOURCE_STORAGE);
  const metadataUrl = `https://onelake.dfs.fabric.microsoft.com/${workspaceId}/${mirroredDatabaseId}/Files/LandingZone/${tableKey}/_metadata.json`;

  try {
    const response = await fetch(metadataUrl, {
      method: "HEAD",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "x-ms-version": "2020-02-10",
      },
    });
    return response.ok;
  } catch (error) {
    consola.warn(`Error checking metadata for table ${tableKey}`, error);
    return false;
  }
}

/**
 * Creates and uploads the _metadata.json file for a table
 * @param tableKey - The table identifier
 * @param keyColumns - Array of column names that form the primary key
 */
export async function createMetadataFile(
  tableKey: string,
  keyColumns: string[],
) {
  const state = await getAzureState();
  const workspaceId = state.workspaceId;
  const mirroredDatabaseId = state.mirroredDatabaseId;
  if (!workspaceId || !mirroredDatabaseId) {
    throw new Error(
      "workspaceId or mirroredDatabaseId is not set. Please set them first.",
    );
  }

  // Create metadata JSON
  const metadata = { keyColumns };
  const metadataContent = JSON.stringify(metadata);
  const metadataBuffer = Buffer.from(metadataContent, "utf-8");

  const accessToken = await getAccessToken(AZURE_RESOURCE_STORAGE);
  const baseUrl = `https://onelake.dfs.fabric.microsoft.com/${workspaceId}/${mirroredDatabaseId}/Files/LandingZone/${tableKey}/_metadata.json`;

  // Step 1: Create the file path
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
      `Failed to create metadata file: ${createResponse.status} ${await createResponse.text()}`,
    );
  }

  // Step 2: Append data to the file
  const appendResponse = await fetch(`${baseUrl}?action=append&position=0`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "x-ms-version": "2020-02-10",
      "Content-Type": "application/json",
      "Content-Length": metadataBuffer.length.toString(),
    },
    body: metadataBuffer,
  });

  if (!appendResponse.ok) {
    throw new Error(
      `Failed to append metadata: ${appendResponse.status} ${await appendResponse.text()}`,
    );
  }

  // Step 3: Flush the file (finalize)
  const flushResponse = await fetch(
    `${baseUrl}?action=flush&position=${metadataBuffer.length}`,
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
      `Failed to flush metadata file: ${flushResponse.status} ${await flushResponse.text()}`,
    );
  }

  consola.success(
    `Created _metadata.json for ${tableKey} with keyColumns: ${keyColumns.join(", ")}`,
  );
}
