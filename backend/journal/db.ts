import { SQLDatabase } from "encore.dev/storage/sqldb";

export const journalDB = new SQLDatabase("journal", {
  migrations: "./migrations",
});
