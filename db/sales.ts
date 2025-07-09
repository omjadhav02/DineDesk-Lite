// 📁 db/sales.ts
import * as SQLite from 'expo-sqlite';
import { getDb } from './shared';
import { Order } from '../types/Order';
import { Sale } from '../types/Sale';

export const createSalesTable = async () => {
  try {
    const db = await getDb();

    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS sales (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        items TEXT,
        totalItems INTEGER,
        totalPrice REAL,
        timestamp TEXT,
        tableNumber INTEGER,
        saleNumber INTEGER,
        orderNumber INTEGER
      );
    `);

    console.log('✅ Sales table ensured');
  } catch (error: any) {
    console.error('❌ Error creating sales table:', error);
  }
};

export const insertSale = async (order: Order): Promise<void> => {
  const db = await getDb();
  const now = new Date().toISOString();

  await db.runAsync(
    `INSERT INTO sales (items, totalItems, totalPrice, timestamp, tableNumber, orderNumber) VALUES (?, ?, ?, ?, ?, ?)`,
    JSON.stringify(order.items),
    order.totalItems,
    order.totalPrice,
    now,
    order.tableNumber,
    order.orderNumber
  );

  const result = await db.getFirstAsync<{ id: number }>('SELECT last_insert_rowid() as id');
  const insertedId = result?.id;

  if (insertedId) {
    await db.runAsync(
      `UPDATE sales SET saleNumber = ? WHERE id = ?`,
      insertedId,
      insertedId
    );
  }

  console.log(`✅ Sale inserted for Order #${order.orderNumber} with saleNumber = id`);
};


export const getAllSales = async (): Promise<Sale[]> => {
  try {
    const db = await getDb();
    const result = await db.getAllAsync<any>('SELECT * FROM sales ORDER BY timestamp DESC');
    return result.map((sale: any) => ({
      ...sale,
      items: JSON.parse(sale.items),
      tableNumber: sale.tableNumber ?? null,
      saleNumber: sale.saleNumber ?? null,
      orderNumber: sale.orderNumber ?? null,
    }));
  } catch (error) {
    console.error('❌ Error fetching sales:', error);
    return [];
  }
};

export const deleteSingleSale = async (id: number): Promise<void> => {
  try {
    const db = await getDb();
    await db.runAsync('DELETE FROM sales WHERE id = ?', id);
    console.log(`🗑️ Sale with ID ${id} deleted`);
  } catch (error) {
    console.error('❌ Error deleting sale:', error);
    throw error;
  }
};

export const deleteAllSales = async (): Promise<void> => {
  try {
    const db = await getDb();
    await db.runAsync('DELETE FROM sales');
    console.log('🗑️ All sales deleted!');
  } catch (error) {
    console.error('❌ Error deleting all sales:', error);
    throw error;
  }
};



