// 📁 db/profile.ts
import { getDb } from './shared';

export const createProfileTable = async () => {
  try {
    const db = await getDb();

    // Set WAL mode first
    await db.execAsync(`PRAGMA journal_mode = WAL;`);

    // await db.execAsync(`DROP TABLE IF EXISTS profile`);

    // Then create the table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS profile (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        adminName TEXT NOT NULL,
        restaurantName TEXT ,
        pin TEXT NOT NULL
      );
    `);

    console.log('✅ Profile table ensured');
  } catch (error: any) {
    console.error('❌ Error creating profile table:', error);
  }
};

export const insertProfile = async (adminName: string, restaurantName: string, pin: string): Promise<void> => {
  try {
    const db = await getDb();
    await db.runAsync(`INSERT INTO profile (adminName, restaurantName, pin) VALUES (?, ?, ?)`, adminName, restaurantName, pin);
    console.log('✅ Profile inserted');
  } catch (error: any) {
    console.error('❌ Error inserting profile:', error);
    throw error;
  }
};

export const getProfile = async (): Promise<{ adminName: string; restaurantName: string; pin: string } | null> => {
  try {
    const db = await getDb();
    const result = await db.getFirstAsync<any>('SELECT * FROM profile LIMIT 1');
    return result || null;
  } catch (error: any) {
    console.error('❌ Error fetching profile:', error);
    return null;
  }
};

export const deleteProfile = async (): Promise<void> => {
  try {
    const db = await getDb();
    await db.runAsync('DELETE FROM profile');
    console.log('🗑️ Profile deleted!');
  } catch (error: any) {
    console.error('❌ Error deleting profile:', error);
    throw error;
  }
};

export const updateProfile = async (adminName: string, restaurantName: string, pin: string): Promise<void> => {
  try {
    const db = await getDb();
    await db.runAsync(`UPDATE profile SET adminName = ?, restaurantName = ?, pin = ?`, adminName, restaurantName, pin);
    console.log('🔄 Profile updated!');
  } catch (error: any) {
    console.error('❌ Error updating profile:', error);
    throw error;
  }
};
