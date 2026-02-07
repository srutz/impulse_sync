
# Impulse Sync

Impulse Sync is reads data from PostgreSQL, packages it into parquet files, and uploads it to azure.


## Usage

The project is centered around a config file residing in the directory .impulse_sync called 
`config.json`. The location is fixed and the file must be named `config.json`. 

The config file contains all the necessary information for the project to run, including database connection details, Azure storage account information, and other relevant settings.

The directory .impulse_sync is also used to store the parquet files generated from the PostgreSQL data. These files are created based on the configurations specified in `config.json` and are subsequently uploaded to Azure storage.

The .impulse_sync is searched for in the the home-directory of the user running the project. 
