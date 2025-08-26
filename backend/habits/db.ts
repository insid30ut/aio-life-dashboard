import { SQL } from 'encore.dev/sql';

// Defines a database named 'habits', connected to the 'habits' PostgreSQL database.
export const habitsDB = SQL.database('habits');
