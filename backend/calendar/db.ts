import { SQLDatabase } from "encore.dev/storage/sqldb";

export const calendarDB = new SQLDatabase("calendar", {
  migrations: "./migrations",
});
