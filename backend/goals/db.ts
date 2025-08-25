import { SQLDatabase } from "encore.dev/storage/sqldb";

export const goalsDB = new SQLDatabase("goals", {
  migrations: "./migrations",
});
