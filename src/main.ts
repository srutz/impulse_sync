import { exit } from "node:process";
import { consola } from "consola";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { tableReset, tableShow } from "./commands";
import { bootstrapConfig, showConfig } from "./config";
import { initDatabasePool } from "./sync/db";
import { runAllSyncs } from "./sync/run";
import { showSyncMarkers } from "./sync/syncmarkers";
import { getMirroredDatabases, getWorkspace, getWorkspaces, setWorkspace } from "./azure/fabric";

async function syncRun() {
  await bootstrapConfig();
  await initDatabasePool();
  consola.success("sync initialized successfully.");
  await runAllSyncs();
}


async function main() {
  await yargs(hideBin(process.argv))
    .command("about",
      "Show about information",
      () => { },
      async () => {
        consola.log("Impulse Sync - Azure Data Sync Tool");
        consola.log("Version: 1.0.0");
        consola.log("(c) Stepan Rutz 2025");
        console.log("");
      }
    )
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
      "workspace <action> [workspaceId]",
      "Manage workspaces",
      (yargs) => {
        return yargs.positional("action", {
          describe: "Action to perform",
          type: "string",
          choices: ["list", "set", "get", "showmirroreddatabases"],
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
          consola.log({ workspaceId });
        } else if (argv.action === "showmirroreddatabases") {
          const mirroredDatabases = await getMirroredDatabases();
          consola.log(JSON.stringify(mirroredDatabases, null, 2));
        }
      },
    )
    .demandCommand(1, "You need to specify a command")
    .help()
    .parseAsync();
}

main();
