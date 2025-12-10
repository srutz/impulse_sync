import { consola } from "consola";
import { bootstrapConfig } from "./config";
import { runAllSyncs } from "./sync";
import { initDatabasePool } from "./db";


consola.box("Impulse Sync");


async function main() {
  await bootstrapConfig();
  await initDatabasePool();
  consola.success("sync initialized successfully.");

  await runAllSyncs();
}
main()

