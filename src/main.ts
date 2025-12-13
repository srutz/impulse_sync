import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { consola } from "consola";
import { bootstrapConfig } from "./config";
import { runAllSyncs } from "./sync";
import { initDatabasePool } from "./db";


consola.box("****************** Impulse Sync ******************");


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
        }
      }
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
      }
    )
    .demandCommand(1, "You need to specify a command")
    .help()
    .parseAsync();
}

main()

