import * as SQLite from 'expo-sqlite';
import { supabase } from './supabase';

let db = null;

const getDb = async () => {
  if (db) return db;
  db = await SQLite.openDatabaseAsync('coteacher.db');
  return db;
};

export const initDb = async () => {
  try {
    const database = await getDb();
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS saved_lessons (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        image_uri TEXT,
        subject TEXT,
        topic TEXT,
        key_concepts TEXT,
        worksheets TEXT,
        language TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Attempt to add subject column if migrating from v0.2
    try {
      await database.execAsync(`ALTER TABLE saved_lessons ADD COLUMN subject TEXT;`);
    } catch (e) {
      // Column likely already exists
    }
    
    console.log("Database initialized successfully.");
  } catch (error) {
    console.error("Error initializing DB:", error);
  }
};

export const saveLesson = async (imageUri, subject, topic, keyConcepts, worksheets, language) => {
  try {
    const database = await getDb();
    const result = await db.runAsync(
      `INSERT INTO saved_lessons (image_uri, subject, topic, key_concepts, worksheets, language, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?);`,
      [imageUri || null, subject, topic, JSON.stringify(keyConcepts), JSON.stringify(worksheets), language, new Date().toISOString()]
    );
    console.log("Lesson saved successfully! ID:", result.lastInsertRowId);

    // Phase 2: Fire-and-forget sync to Supabase Cloud
    try {
      await supabase.from('lessons').insert([{
        local_id: result.lastInsertRowId,
        subject: subject,
        topic: topic,
        key_concepts: keyConcepts,
        worksheets: worksheets,
        language: language
      }]);
      console.log("Lesson synced to Supabase cloud!");
    } catch (syncErr) {
      console.log("Offline or failed to sync to cloud. Lesson is safe locally.", syncErr);
    }
    
  } catch (err) {
    console.error("Error saving lesson:", err);
    throw err;
  }
};

export const getSavedLessons = async () => {
  try {
    const database = await getDb();
    const rows = await database.getAllAsync('SELECT * FROM saved_lessons ORDER BY created_at DESC');
    return rows.map(row => ({
      ...row,
      key_concepts: JSON.parse(row.key_concepts),
      worksheets: JSON.parse(row.worksheets)
    }));
  } catch (error) {
    console.error("Error retrieving lessons:", error);
    return [];
  }
};
