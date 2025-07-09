// 📁 db/table.ts
import { getDb } from './shared';

export const createTableTable = async () => {
  const db = await getDb();
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS tables (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tableNumber INTEGER UNIQUE
    )
  `);
};

export const insertTable = async (tableNumber: number) => {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO tables (tableNumber) VALUES (?)`,
    tableNumber
  );
};

export const getAllTables = async (): Promise<{ id: number; tableNumber: number }[]> => {
  const db = await getDb();
  return await db.getAllAsync(`SELECT * FROM tables ORDER BY tableNumber ASC`);
};

export const deleteSingleTable = async (id: number) => {
  const db = await getDb();
  await db.runAsync(`DELETE FROM tables WHERE id = ?`, id);
};

export const deleteAllTables = async () => {
  const db = await getDb();
  await db.runAsync(`DELETE FROM tables`);
};
