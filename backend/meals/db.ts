import { SQLDatabase } from "encore.dev/storage/sqldb";

export const mealsDB = new SQLDatabase("meals", {
  migrations: "./migrations",
});
