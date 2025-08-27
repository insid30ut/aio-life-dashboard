import { SQLDatabase } from "encore.dev/storage/sqldb";

export const habitsDB = new SQLDatabase("habits", {
  migrations: "./migrations",
});
