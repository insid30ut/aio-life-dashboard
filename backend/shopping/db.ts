import { SQLDatabase } from "encore.dev/storage/sqldb";

export const shoppingDB = new SQLDatabase("shopping", {
  migrations: "./migrations",
});
