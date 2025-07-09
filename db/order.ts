import * as SQLite from 'expo-sqlite';
import { Order } from '../types/Order';
import { RawOrder } from '../types/RawOrder';
import { getDb } from './shared';

export const createOrderTable = async () => {
  try {
    const db = await getDb();

    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        items TEXT,
        totalItems INTEGER,
        totalPrice REAL,
        timestamp TEXT,
        orderNumber INTEGER
      );
    `);

    // Try adding `tableNumber` column if it doesn't exist
    try {
      await db.runAsync(`ALTER TABLE orders ADD COLUMN tableNumber INTEGER`);
      console.log('✅ tableNumber column added to orders');
    } catch (alterErr: any) {
      if (
        alterErr.message.includes('duplicate column name') ||
        alterErr.message.includes('already exists')
      ) {
        console.log('ℹ️ tableNumber column already exists');
      } else {
        throw alterErr;
      }
    }

    console.log('✅ Order table ensured');
  } catch (error: any) {
    console.error('❌ Error creating order table:', error);
  }
};

// Insert order and use `id` as orderNumber
export const insertOrder = async (order: {
  items: any[];
  totalItems: number;
  totalPrice: number;
  tableNumber: number;
}): Promise<void> => {
  try {
    const db = await getDb();
    const now = new Date().toISOString();

    // Insert order without orderNumber first
    await db.runAsync(
      `INSERT INTO orders (items, totalItems, totalPrice, timestamp, tableNumber) VALUES (?, ?, ?, ?, ?)`,
      JSON.stringify(order.items),
      order.totalItems,
      order.totalPrice,
      now,
      order.tableNumber
    );

    // Get last inserted row ID and update orderNumber = id
    const result = await db.getFirstAsync<{ id: number }>('SELECT last_insert_rowid() as id');
    const insertedId = result?.id;

    if (insertedId) {
      await db.runAsync(
        `UPDATE orders SET orderNumber = ? WHERE id = ?`,
        insertedId,
        insertedId
      );
    }

    console.log(`✅ Order inserted for Table #${order.tableNumber} with orderNumber = id`);
  } catch (error) {
    console.error('❌ Error inserting order:', error);
    throw error;
  }
};

export const getAllOrders = async (): Promise<Order[]> => {
  try {
    const db = await getDb();
    const result = await db.getAllAsync<RawOrder>('SELECT * FROM orders ORDER BY timestamp DESC');
    return result.map(order => ({
      ...order,
      items: JSON.parse(order.items),
      tableNumber: order.tableNumber ?? null,
    }));
  } catch (error) {
    console.error('❌ Error fetching orders:', error);
    return [];
  }
};

export const getSingleOrder = async (id: number): Promise<Order | null> => {
  try {
    const db = await getDb();
    const result = await db.getFirstAsync<RawOrder>('SELECT * FROM orders WHERE id = ?', id);
    if (result) {
      return {
        ...result,
        items: JSON.parse(result.items),
        tableNumber: result.tableNumber ?? null,
      };
    }
    return null;
  } catch (error) {
    console.error('❌ Error fetching single order:', error);
    return null;
  }
};

export const deleteSingleOrder = async (id: number): Promise<void> => {
  try {
    const db = await getDb();
    await db.runAsync('DELETE FROM orders WHERE id = ?', id);
    console.log(`🗑️ Order with ID ${id} deleted`);
  } catch (error) {
    console.error('❌ Error deleting order:', error);
    throw error;
  }
};

export const deleteAllOrders = async (): Promise<void> => {
  try {
    const db = await getDb();
    await db.runAsync('DELETE FROM orders');
    console.log('🗑️ All orders deleted!');
  } catch (error) {
    console.error('❌ Error deleting all orders:', error);
    throw error;
  }
};

// Reset order autoincrement sequence
export const resetOrderAutoIncrement = async (): Promise<void> => {
  try {
    const db = await getDb();
    await db.runAsync('DELETE FROM sqlite_sequence WHERE name = "orders"');
    console.log('✅ Order AUTOINCREMENT reset');
  } catch (error) {
    console.error('❌ Error resetting order autoincrement:', error);
    throw error;
  }
};

// *** NEW: Reset order numbers by deleting all orders AND resetting autoincrement ***
export const resetOrderNumbers = async (): Promise<void> => {
  try {
    const db = await getDb();
    await db.runAsync('DELETE FROM orders'); // delete all existing orders
    await db.runAsync('DELETE FROM sqlite_sequence WHERE name = "orders"'); // reset autoincrement sequence
    console.log('✅ Orders deleted and AUTOINCREMENT reset');
  } catch (error) {
    console.error('❌ Error resetting order numbers:', error);
    throw error;
  }
};

// Additional exports if needed below (unchanged)...

export const getActiveTableNumbers = async (): Promise<number[]> => {
  try {
    const db = await getDb();
    const result = await db.getAllAsync<{ tableNumber: number }>('SELECT DISTINCT tableNumber FROM orders');
    return result.map(r => r.tableNumber);
  } catch (error) {
    console.error('❌ Error fetching active table numbers:', error);
    return [];
  }
};

export const getOrderByTable = async (tableNumber: number): Promise<Order | null> => {
  try {
    const db = await getDb();
    const result = await db.getFirstAsync<RawOrder>('SELECT * FROM orders WHERE tableNumber = ?', tableNumber);
    if (result) {
      return {
        ...result,
        items: JSON.parse(result.items),
        tableNumber: result.tableNumber ?? null,
      };
    }
    return null;
  } catch (error) {
    console.error('❌ Error fetching order by table:', error);
    return null;
  }
};

export const updateOrderById = async (order: Order): Promise<void> => {
  try {
    const db = await getDb();
    const now = new Date().toISOString();

    await db.runAsync(
      `UPDATE orders SET items = ?, totalItems = ?, totalPrice = ?, timestamp = ? WHERE id = ?`,
      JSON.stringify(order.items),
      order.totalItems,
      order.totalPrice,
      now,
      order.id
    );

    console.log(`🔄 Order ID ${order.id} updated successfully`);
  } catch (error) {
    console.error('❌ Error updating order:', error);
    throw error;
  }
};
