#!/usr/bin/env node
/** biome-ignore-all lint/style/useTemplate: its ok */

import { exit } from "node:process";
import { consola } from "consola";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import {
  getMirroredDatabase,
  getMirroredDatabases,
  getWorkspace,
  getWorkspaces,
  setMirroredDatabase,
  setWorkspace,
} from "./azure/fabric";
import { tableReset, tableShow } from "./commands";
import { bootstrapConfig, checkForExistingConfig, showConfig } from "./config";
import { CONFIG_PATH } from "./paths";
import { initDatabasePool } from "./sync/db";
import { runSyncLoop, runSyncsOnce } from "./sync/run";
import { showSyncMarkers } from "./sync/syncmarkers";
import { dumpParquetFileAsCsv } from "./sync/util";

async function main() {
  await yargs(hideBin(process.argv))
    .command(
      "about",
      "Show about information",
      () => { },
      async () => {
        consola.log("Impulse Sync - Azure Data Sync Tool");
        consola.log("Version: 1.0.0");
        consola.log("(c) Stepan Rutz 2025");
        console.log("");
      },
    )
    .command(
      "newconfig",
      "Create new config and marker files with default values",
      () => { },
      async () => {
        // check for existing config and marker files and create them with default values if they don't exist
        const existingConfig = await checkForExistingConfig();
        if (existingConfig) {
          consola.error("Config file already exists at " + CONFIG_PATH);
          exit(1);
        }
        await bootstrapConfig();
        consola.success("Config file created at " + CONFIG_PATH);
        exit(0);
      },
    )
    .command(
      "sync <action>",
      "Sync data",
      (yargs) => {
        return yargs.positional("action", {
          describe: "Action to perform",
          type: "string",
          choices: ["runloop", "run", "dryrun"],
        });
      },
      async (argv) => {
        if (argv.action === "run") {
          await bootstrapConfig();
          await initDatabasePool();
          try {
            await runSyncsOnce(false);
            exit(0);
          } catch (error) {
            consola.error("Sync failed:", error);
            exit(1);
          }
        } else if (argv.action === "runloop") {
          await bootstrapConfig();
          await initDatabasePool();
          try {
            await runSyncLoop(false);
          } catch (error) {
            consola.error("Sync loop failed:", error);
            exit(1);
          }
        } else if (argv.action === "dryrun") {
          await bootstrapConfig();
          await initDatabasePool();
          try {
            await runSyncsOnce(true);
            exit(0);
          } catch (error) {
            consola.error("Dry run failed:", error);
            exit(1);
          }
        }
      },
    )
    .command(
      "parquetdump <filename>",
      "Dump a specific parquet file to console as csv for debugging",
      (yargs) => {
        return yargs.positional("filename", {
          describe: "Name of the parquet file to dump",
          type: "string",
        });
      },
      async (argv) => {
        const filePath = argv.filename as string;
        try {
          const csvData = await dumpParquetFileAsCsv(filePath);
          console.log(csvData);
          exit(0);
        } catch (error) {
          consola.error("Failed to dump parquet file:", error);
          exit(1);
        }
      },
    )
    .command(
      "show <action>",
      "Show data",
      (yargs) => {
        return yargs.positional("action", {
          describe: "Action to perform",
          type: "string",
          choices: ["markers", "config"],
        });
      },
      async (argv) => {
        if (argv.action === "markers") {
          await showSyncMarkers();
        } else if (argv.action === "config") {
          await showConfig();
        }
      },
    )
    .command(
      "table <action> [tableName]",
      "Modify tables",
      (yargs) => {
        return yargs
          .positional("action", {
            describe: "Action to perform",
            type: "string",
            choices: ["reset", "show"],
          })
          .positional("tableName", {
            describe: "Name of the table",
            type: "string",
          });
      },
      async (argv) => {
        if (argv.action === "reset") {
          if (!argv.tableName) {
            consola.error("Table name is required for reset action");
            exit(1);
          }
          await tableReset(argv.tableName as string);
        } else if (argv.action === "show") {
          if (!argv.tableName) {
            consola.error("Table name is required for reset action");
            exit(1);
          }
          await tableShow(argv.tableName as string);
        }
      },
    )
    .command(
      "workspace <action> [workspaceId]",
      "Manage workspaces",
      (yargs) => {
        return yargs.positional("action", {
          describe: "Action to perform",
          type: "string",
          choices: ["list", "set", "get"],
        });
      },
      async (argv) => {
        if (argv.action === "list") {
          const workspaces = await getWorkspaces();
          consola.log(JSON.stringify(workspaces, null, 2));
        } else if (argv.action === "set") {
          if (!argv.workspaceId) {
            consola.error("workspaceId is required for setworkspace action");
            exit(1);
          }
          setWorkspace(argv.workspaceId as string);
        } else if (argv.action === "get") {
          const workspaceId = await getWorkspace();
          if (!workspaceId) {
            consola.warn("workspaceId is not set.");
            exit(1);
          }
          consola.log({ workspaceId });
        }
      },
    )
    .command(
      "mirroreddatabase <action> [databaseId]",
      "Manage workspaces",
      (yargs) => {
        return yargs.positional("action", {
          describe: "Action to perform",
          type: "string",
          choices: ["list", "set", "get"],
        });
      },
      async (argv) => {
        if (argv.action === "list") {
          const mirroredDatabases = await getMirroredDatabases();
          consola.log(JSON.stringify(mirroredDatabases, null, 2));
        } else if (argv.action === "set") {
          const workspaceId = await getWorkspace();
          if (!workspaceId) {
            consola.error(
              "a set workspaceId has to be set before settting the mirrored-database",
            );
            exit(1);
          }
          if (!argv.databaseId) {
            consola.error(
              "a mirroreddatabaseId is required as argument for setmirroreddatabase action",
            );
            exit(1);
          }
          await setMirroredDatabase(argv.databaseId as string);
        } else if (argv.action === "get") {
          const workspaceId = await getWorkspace();
          if (!workspaceId) {
            consola.error(
              "a set workspaceId is required for getmirroreddatabase action",
            );
            exit(1);
          }
          const mirroredDatabase = await getMirroredDatabase();
          if (!mirroredDatabase) {
            consola.warn("mirroredDatabaseId is not set.");
            exit(1);
          }
          consola.log({ mirroredDatabase });
        }
      },
    )
    .demandCommand(1, "You need to specify a command")
    .help()
    .parseAsync();
}

main();
