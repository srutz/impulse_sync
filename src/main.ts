import { exit } from "node:process";
import { consola } from "consola";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { tableReset, tableShow } from "./commands";
import { bootstrapConfig, showConfig } from "./config";
import { initDatabasePool } from "./sync/db";
import { runAllSyncs } from "./sync/run";
import { showSyncMarkers } from "./sync/syncmarkers";

consola.log("Impulse Sync CLI");
consola.log("(C) 2025 Stepan Rutz, all rights reserved.");
consola.log("");

async function syncRun() {
  await bootstrapConfig();
  await initDatabasePool();
  consola.success("sync initialized successfully.");

  await runAllSyncs();
}

async function workspacesList() {
  consola.info("Listing workspaces...");
  // TODO: Implement workspaces list
}

async function main() {
  await yargs(hideBin(process.argv))
    .command(
      "sync <action>",
      "Sync data",
      (yargs) => {
        return yargs.positional("action", {
          describe: "Action to perform",
          type: "string",
          choices: ["run"],
        });
      },
      async (argv) => {
        if (argv.action === "run") {
          await syncRun();
          exit(0);
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
      "workspaces <action>",
      "Manage workspaces",
      (yargs) => {
        return yargs.positional("action", {
          describe: "Action to perform",
          type: "string",
          choices: ["list"],
        });
      },
      async (argv) => {
        if (argv.action === "list") {
          await workspacesList();
        }
      },
    )
    .demandCommand(1, "You need to specify a command")
    .help()
    .parseAsync();
}

main();
