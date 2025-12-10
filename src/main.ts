import { consola } from "consola";


consola.box("Impulse Sync");

import { bootstrapConfig } from "./config.js";

async function main() {
  await bootstrapConfig();
  consola.success("sync initialized successfully.");
}
main()

