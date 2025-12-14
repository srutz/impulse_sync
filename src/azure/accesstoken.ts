import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export const AZURE_RESOURCE_FABRIC = "https://api.fabric.microsoft.com"


export type accessTokenCacheEntry = {
  token: string,
  creationTime: Date,
  resource: string
}
let accessTokenCache = new Map<string, accessTokenCacheEntry>();


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
    resource
  });
  return token;
}

async function fetchAccessTokenInternal(resource: string): Promise<string> {
  const { stdout } = await execAsync(
    `az account get-access-token --resource ${resource} --query accessToken -o tsv`
  );
  return stdout.trim();
}