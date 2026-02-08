# Distribution Instructions

## For Windows Users

### Prerequisites
1. Install Node.js 22 or higher: https://nodejs.org/
2. Install Azure CLI: https://learn.microsoft.com/en-us/cli/azure/install-azure-cli-windows

### Installation Steps

1. Extract the zip file to a folder of your choice
2. Open PowerShell or Command Prompt in that folder
3. Run: `npm install --production`
4. Verify installation: `npx impulse-sync`

### First Time Setup

1. Login to Azure: `az login`
2. Create config: `npx impulse-sync newconfig`
3. List workspaces: `npx impulse-sync workspace list`

See README.md for detailed usage instructions.
