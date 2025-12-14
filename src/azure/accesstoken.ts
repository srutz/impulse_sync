import { exec } from "node:child_process";
import { promisify } from "node:util";

const execAsync = promisify(exec);

export const AZURE_RESOURCE_FABRIC = "https://api.fabric.microsoft.com";
export const AZURE_RESOURCE_STORAGE = "https://storage.azure.com/";

export type accessTokenCacheEntry = {
  token: string;
  creationTime: Date;
  resource: string;
};
const accessTokenCache = new Map<string, accessTokenCacheEntry>();

export async function getAccessToken(resource: string): Promise<string> {
  const cachedEntry = accessTokenCache.get(resource);
  if (cachedEntry) {
    const now = new Date();
    const elapsed = (now.getTime() - cachedEntry.creationTime.getTime()) / 1000;
    if (elapsed < 3500) {
      return cachedEntry.token;
    }
  }
  const token = await fetchAccessTokenInternal(resource);
  accessTokenCache.set(resource, {
    token,
    creationTime: new Date(),
    resource,
  });
  return token;
}

async function fetchAccessTokenInternal(resource: string): Promise<string> {
  const { stdout, stderr } = await execAsync(
    `az account get-access-token --resource ${resource} --query accessToken -o tsv`,
  );
  if (stderr) {
    throw new Error(`Failed to get access token: ${stderr}`);
  }
  return stdout.trim();
}
