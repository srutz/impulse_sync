
import { consola } from "consola";

// run the sync process for one table after the other,

import { Pool } from "pg";
import { config } from "./config";

if (!config) {
  consola.fatal("Config not initialized");
  process.exit(1);
}

const pool = new Pool({
  idle_in_transaction_session_timeout: 200_000,
  idleTimeoutMillis: 100_000,
  max: 8,
  host: config.postgres.host,
  port: config.postgres.port,
  user: config.postgres.user,
  password: config.postgres.password,
  database: config.postgres.database,
});
export { pool };