// 📁 db/product.ts
import * as SQLite from 'expo-sqlite';
import { Product } from '../types/Product';

import { getDb } from './shared';

export async function createProductTable(): Promise<void> {
  try {
    const db = await getDb();
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS products(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        itemName TEXT NOT NULL UNIQUE,
        price REAL NOT NULL,
        description TEXT,
        imageUri TEXT
      );
    `);
    console.log('✅ Product table created');
  } catch (error) {
    console.log('❌ Error creating product table:', error);
  }
}

export async function insertProduct(product: Product): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO products (itemName, price, description, imageUri) VALUES (?, ?, ?, ?);`,
    product.itemName,
    product.price,
    product.description ?? '',
    product.imageUri ?? ''
  );
}

export async function updateProduct(product: Product): Promise<void> {
  if (!product.id) throw new Error('Product ID is required for updating');
  const db = await getDb();
  await db.runAsync(
    `UPDATE products SET itemName = ?, price = ?, description = ?, imageUri = ? WHERE id = ?;`,
    product.itemName,
    product.price,
    product.description ?? '',
    product.imageUri ?? '',
    product.id
  );
}

export async function deleteProduct(product: Product): Promise<void> {
  if (!product.id) throw new Error('Product ID is required for deletion');
  const db = await getDb();
  await db.runAsync('DELETE FROM products WHERE id = ?', product.id);
}

export async function getProductById(id: number): Promise<Product | null> {
  const db = await getDb();
  const result = await db.getFirstAsync<Product>('SELECT * FROM products WHERE id = ?', id);
  return result ?? null;
}

export async function getAllProducts(): Promise<Product[]> {
  const db = await getDb();
  return await db.getAllAsync<Product>('SELECT * FROM products');
}

export async function deleteAllProducts(): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM products');
}
