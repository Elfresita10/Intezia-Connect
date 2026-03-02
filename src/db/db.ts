// src/db/db.ts
import sqlite3InitModule from '@sqlite.org/sqlite-wasm';
import { createClient } from '@libsql/client';

export interface ConsultantProfile { id: number; name: string; title: string; email: string; phone: string; bio: string; }
export interface User { id: number; name: string; password?: string; role: 'Super admin' | 'Admin' | 'Consultor'; email: string; phone: string; bio: string; title: string; avatarBase64?: string; }
export interface Project { id: number; title: string; client: string; status: 'En Progreso' | 'Completado' | 'Pausado'; progress: number; dueDate: string; }
export interface ProjectTask { id: number; project_id: number; title: string; description: string; status: 'Pendiente' | 'En Progreso' | 'En Revisión' | 'Completado'; assigned_to: string; }
export interface Education { id: number; title: string; institution: string; year: string; type: 'Certificación' | 'Título' | 'Curso'; status: 'Realizada' | 'Disponible' | 'En Progreso'; }
export interface CourseModule { id: number; education_id: number; title: string; video_url: string; }
export interface CourseResource { id: number; education_id: number; name: string; url: string; }
export interface Fundamental { id: number; type: string; category: string; title: string; description: string; url: string; }

export interface UnifiedDB {
  type: 'local' | 'remote';
  exec: (options: string | { sql: string; bind?: any[]; returnValue?: 'resultRows' | 'blob' | 'resultRows' }) => Promise<any>;
}

let dbInstance: UnifiedDB | null = null;
let initPromise: Promise<UnifiedDB> | null = null;

const SCHEMA = [
  "CREATE TABLE IF NOT EXISTS profile (id INTEGER PRIMARY KEY, name TEXT, title TEXT, email TEXT, phone TEXT, bio TEXT)",
  "CREATE TABLE IF NOT EXISTS projects (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, client TEXT, status TEXT, progress INTEGER, dueDate TEXT)",
  "CREATE TABLE IF NOT EXISTS project_tasks (id INTEGER PRIMARY KEY AUTOINCREMENT, project_id INTEGER, title TEXT, description TEXT, status TEXT, assigned_to TEXT, FOREIGN KEY (project_id) REFERENCES projects(id))",
  "CREATE TABLE IF NOT EXISTS education (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, institution TEXT, year TEXT, type TEXT, status TEXT)",
  "CREATE TABLE IF NOT EXISTS course_modules (id INTEGER PRIMARY KEY AUTOINCREMENT, education_id INTEGER, title TEXT, video_url TEXT)",
  "CREATE TABLE IF NOT EXISTS course_resources (id INTEGER PRIMARY KEY AUTOINCREMENT, education_id INTEGER, name TEXT, url TEXT)",
  "CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, password TEXT, role TEXT, email TEXT UNIQUE, phone TEXT, bio TEXT, title TEXT, avatarBase64 TEXT)",
  "CREATE TABLE IF NOT EXISTS audit_logs (id INTEGER PRIMARY KEY AUTOINCREMENT, user_name TEXT, action TEXT, entity TEXT, details TEXT, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP)",
  "CREATE TABLE IF NOT EXISTS fundamentals (id INTEGER PRIMARY KEY AUTOINCREMENT, type TEXT, category TEXT, title TEXT, description TEXT, url TEXT)"
];

export const initDB = async (): Promise<UnifiedDB> => {
  if (dbInstance) return dbInstance;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      const dbUrl = import.meta.env.VITE_DB_URL;
      const dbToken = import.meta.env.VITE_DB_AUTH_TOKEN;

      if (dbUrl && dbToken) {
        console.log('SQL_ARCH: Connecting to Remote Turso...');
        const client = createClient({ url: dbUrl, authToken: dbToken });

        const remoteDB: UnifiedDB = {
          type: 'remote',
          exec: async (opt) => {
            const sql = typeof opt === 'string' ? opt : opt.sql;
            const args = typeof opt === 'string' ? [] : (opt.bind || []);
            const res = await client.execute({ sql, args });
            if (typeof opt !== 'string' && opt.returnValue === 'resultRows') {
              return res.rows.map(row => {
                const obj: any = {};
                res.columns.forEach((col, idx) => { obj[col] = row[idx]; });
                return obj;
              });
            }
            return res;
          }
        };

        for (const stmt of SCHEMA) await client.execute(stmt);

        // Seed default users if remote is fresh
        const users = await remoteDB.exec({ sql: "SELECT count(*) as count FROM users", returnValue: 'resultRows' });
        if (users[0].count === 0) {
          await remoteDB.exec({
            sql: "INSERT INTO users (name, password, role, email, title) VALUES (?, ?, ?, ?, ?), (?, ?, ?, ?, ?)",
            bind: ['Administrador', 'admin', 'Super admin', 'admin@intezia.com', 'Director'],
            // Add second user
          });
          // Fix: bind only takes one array if used with multiple values? Better do separate inserts or flattened bind.
          await remoteDB.exec({
            sql: "INSERT OR IGNORE INTO users (id, name, password, role, email, phone, bio, title) VALUES (2, ?, ?, ?, ?, ?, ?, ?)",
            bind: ['Jean Valery', '123456', 'Super admin', 'jean@intezia.com', '+1 555 111 2222', 'CEO', 'CEO & Partner']
          });
        }

        dbInstance = remoteDB;
      } else {
        console.log('SQL_ARCH: Using Local SQLite WASM...');
        const sqlite3 = await sqlite3InitModule();
        const path = '/intezia_connect_v12.db';
        const db = 'opfs' in sqlite3.oo1.DB ? new sqlite3.oo1.OpfsDb(path) : new sqlite3.oo1.DB(path, 'ct');

        const localDB: UnifiedDB = {
          type: 'local',
          exec: async (opt) => {
            if (typeof opt === 'string') return db.exec(opt);
            return db.exec({
              sql: opt.sql,
              bind: opt.bind,
              returnValue: opt.returnValue as any,
              rowMode: 'object'
            });
          }
        };

        for (const stmt of SCHEMA) db.exec(stmt);
        dbInstance = localDB;
      }
      return dbInstance;
    } catch (err) {
      console.error("SQL_ARCH: DB Failed:", err);
      throw err;
    }
  })();
  return initPromise;
};

export const getOrInitDB = async (): Promise<UnifiedDB> => {
  if (dbInstance) return dbInstance;
  return await initDB();
};

export const getDb = (): UnifiedDB => {
  if (!dbInstance) throw new Error("Database not initialized. Use await getOrInitDB()");
  return dbInstance;
};

export const logAction = async (user: string, action: string, entity: string, details: string) => {
  try {
    const db = await getOrInitDB();
    await db.exec({
      sql: 'INSERT INTO audit_logs (user_name, action, entity, details) VALUES (?, ?, ?, ?)',
      bind: [user, action, entity, details]
    });
  } catch (e) { console.error("Log fail:", e); }
};
