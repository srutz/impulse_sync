import { exec } from 'child_process';
import { promisify } from 'util';
import { AZURE_RESOURCE_FABRIC, getAccessToken } from './accesstoken';

export type Workspace = {
  id: string;
  displayName: string;
  description: string;
  type: string;
  capacityId?: string | null;
}

export async function getWorkspaces() {
  const response = await fetch('https://api.fabric.microsoft.com/v1/workspaces', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${await getAccessToken(AZURE_RESOURCE_FABRIC)}`,
      'Content-Type': 'application/json'
    }
  })
  const data = await response.json() as { value: Workspace[] };
  return data;
}

export async function getMirroredDatabases(workspaceId: string) {
  const response = await fetch(`https://api.fabric.microsoft.com/v1/workspaces/${workspaceId}/mirroredDatabases`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${await getAccessToken(AZURE_RESOURCE_FABRIC)}`,
      'Content-Type': 'application/json'
    }
  })
  const data = await response.json();
  return data;
}

