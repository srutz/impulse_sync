
# Impulse Sync - Fabric Open-Mirroring-Client
 
Impulse Sync is a Microsoft-Fabric Open-Mirroring-Client and reads data from PostgreSQL, packages it into parquet files, and uploads it to azure.

## Disclaimer

This project is absolutely free to use, even commercially. This project comes with no warranty. Use at your own risk.


## Usage (in a nutshell)

```
npx impulse-sync
```

(Install node.js before you use it)


## Credits

Thanks to [daten-wg.com](https://www.daten-wg.com/) for their expertise in Microsoft Fabric and for accompanying help on this project. 

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
This means you are **free to use, modify, and distribute the software** as long as you include the original copyright notice and license in any copies or substantial portions of the software. The software is provided "as is", without any warranty of any kind. For more details, please refer to the LICENSE file.


## Usage-Details

The project is centered around a config file residing in the directory .impulse_sync called 
`config.json`. The location is fixed and the file must be named `config.json`. 

The config file contains all the necessary information for the project to run, including database connection details, Azure storage account information, and other relevant settings.

The directory .impulse_sync is also used to store the parquet files generated from the PostgreSQL data. These files are created based on the configurations specified in `config.json` and are subsequently uploaded to Azure storage.

The .impulse_sync is searched for in the the home-directory of the user running the project. 

## Setup for new Sync

0. Unpack the project and navigate to the project directory in your terminal. Run

```
npm install
```

for installing the necessary dependencies. This needs to be done only once. After that, you can run

```
npx impulse-sync 
```

to see the available commands and options and verify that the project is set up correctly.

1. Install nodejs and npm: https://nodejs.org/en/download/. Version 22 or higher is required.

2. Install azure cli: https://learn.microsoft.com/en-us/cli/azure/install-azure-cli

3. Login into az with the azure cli: `az login` 
  (You need to login into azure with an account that access permissions to the exact mirrored-dabase you want to sync)


4. Create a config file in the .impulse_sync directory in your home directory. The config file should be named `config.json` and should contain the necessary configuration details for your sync. You can use the following template as a starting point:

```
npx impulse-sync newconfig
``` 

This will generate a new config file with the necessary fields. Fill in the details according to your specific requirements, such as database connection information, Azure storage account details, and any other relevant settings.


5. List the available workspaces 

```
npx impulse-sync workspace list
```

6. Choose the workspace you want to use for the sync and set it as the active workspace:

```
npx impulse-sync workspace set <your-workspace-id>
```

7. List the available mirrored databases in the active workspace:

```
npx impulse-sync mirroreddatabase list
```

8. Choose the mirrored database you want to sync and set it as the active mirrored database:

```
npx impulse-sync mirroreddatabase set <your-mirrored-database-id>
```

9. Run the sync process to read data from PostgreSQL, package it into parquet files, and upload it to Azure:

```
npx impulse-sync sync run
``` 

You can also try the other options like running the sync in a loop with a specified interval (e.g., every hour):

```
npx impulse-sync sync runloop
```

The interval can be configured in the `config.json` file under the `delaySecondsBetweenSyncs` field.

or to just create the parquet files without uploading to azure, you can run

```
npx impulse-sync sync dryrun
``` 
