import * as SQLite from 'expo-sqlite';
import { Product } from '../types/Product';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase>{
    if(!dbPromise){
        const db = SQLite.openDatabaseAsync('dinedesk-lite');
      dbPromise = Promise.resolve(db);
    }
    return dbPromise
} 

export async function createTable(): Promise<void>{
    console.log('createTable() called');
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
        console.log('✅ product table created')

    } catch (error) {
        console.log('Erro creating product table:', error)
    }
}

export async function getProductById(id:number):Promise<Product | null>{
    try {
        const db = await getDb();
        const result = await db.getFirstAsync('SELECT * FROM products WHERE id = ?',id)
        if(result){
            return result as Product;
        }
        return null;
    } catch (error) {
        console.error('Error fetching product by ID:', error);
        return null;
    }
}

export async function getAllProducts(): Promise<any[]>{
    try {
        const db = await getDb();
        const result = await db.getAllAsync('SELECT * FROM products')
        return result;

    } catch (error) {
        console.log('Erro fetching All products',error);
        return [];
    }
}

export async function insertProduct(product: Product):Promise<void>{
    try {
        const db = await getDb();
        await db.runAsync(
            `INSERT INTO products (itemName,price,description,imageUri) VALUES (?,?,?,?);`,
            product.itemName,
            product.price,
            product.description ?? '',
            product.imageUri ?? '',

        )
        console.log('Product inserted')
    } catch (error) {
        console.error('error inserting product',error);
        throw error;
    }
}

export async function updateProduct(product:Product):Promise<void>{
    try {
        const db = await getDb();
        if(!product.id){
            throw new Error('Product ID is required for updating')
        }
        await db.runAsync(
            `UPDATE products SET itemName = ?,
                price = ?,
                description = ?,
                imageUri = ? 
                WHERE id = ?;`,
                product.itemName,
                product.price,
                product.description ?? '',
                product.imageUri ?? '',
                product.id
        )
    } catch (error) {
        console.error('❌ Error updating product:', error);
    throw error;
    }
}

export async function deleteProduct(product:Product):Promise<void>{
    try {
        const db = await getDb();
        if(!product.id){
            throw new Error('Product ID is required for deletion')
        }
        await db.runAsync('DELETE FROM products WHERE id = ?', product.id);
        console.log(`Product "${product.itemName}" deleted`)
        
    } catch (error) {
        console.error('error while deleting product',error);
        throw error;
    }
}

export async function deleteAllProducts():Promise<void>{
    try {
        const db = await getDb();
        await db.runAsync("DELETE FROM products")
        console.log("All Products deleted!")
        
    } catch (error) {
         console.error('error while deleting all product',error);
        throw error;
    }
}
