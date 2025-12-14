import { AZURE_RESOURCE_FABRIC, getAccessToken } from "./accesstoken";
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
