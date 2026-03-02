// src/db/db.ts
import sqlite3InitModule from '@sqlite.org/sqlite-wasm';
import { createClient } from '@libsql/client';

export interface ConsultantProfile {
  id: number;
  name: string;
  title: string;
  email: string;
  phone: string;
  bio: string;
}

export interface User {
  id: number;
  name: string;
  password?: string;
  role: 'Super admin' | 'Admin' | 'Consultor';
  email: string;
  phone: string;
  bio: string;
  title: string;
  avatarBase64?: string;
}

export interface Project {
  id: number;
  title: string;
  client: string;
  status: 'En Progreso' | 'Completado' | 'Pausado';
  progress: number;
  dueDate: string;
}

export interface ProjectTask {
  id: number;
  project_id: number;
  title: string;
  description: string;
  status: 'Pendiente' | 'En Progreso' | 'En Revisión' | 'Completado';
  assigned_to: string;
}

export interface Education {
  id: number;
  title: string;
  institution: string;
  year: string;
  type: 'Certificación' | 'Título' | 'Curso';
  status: 'Realizada' | 'Disponible' | 'En Progreso';
}

export interface CourseModule {
  id: number;
  education_id: number;
  title: string;
  video_url: string;
}

export interface CourseResource {
  id: number;
  education_id: number;
  name: string;
  url: string;
}

export interface Fundamental {
  id: number;
  type: string;
  category: string;
  title: string;
  description: string;
  url: string;
}

// Unified Database Interface
export interface UnifiedDB {
  type: 'local' | 'remote';
  exec: (options: string | { sql: string; bind?: any[]; returnValue?: string; rowMode?: string }) => any;
}

let dbInstance: UnifiedDB | null = null;
let initPromise: Promise<UnifiedDB> | null = null;

export const initDB = async (): Promise<UnifiedDB> => {
  if (dbInstance) return dbInstance;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      const dbUrl = import.meta.env.VITE_DB_URL;
      const dbToken = import.meta.env.VITE_DB_AUTH_TOKEN;

      if (dbUrl && dbToken) {
        console.log('Connecting to Remote Turso Database...');
        const remoteClient = createClient({
          url: dbUrl,
          authToken: dbToken,
        });

        const unifiedRemote: UnifiedDB = {
          type: 'remote',
          exec: async (options) => {
            const sql = typeof options === 'string' ? options : options.sql;
            const bind = typeof options === 'string' ? [] : (options.bind || []);

            try {
              // LibSQL execute
              const result = await remoteClient.execute({ sql, args: bind });

              // Map back to what the app expects if resultRows is requested
              if (typeof options !== 'string' && options.returnValue === 'resultRows') {
                return result.rows.map(row => {
                  const obj: any = {};
                  result.columns.forEach((col, idx) => {
                    obj[col] = row[idx];
                  });
                  return obj;
                });
              }
              return result;
            } catch (execError: any) {
              console.error(`Database Execution Error [${sql}]:`, execError);
              throw execError;
            }
          }
        };

        // Initialize Schema on remote if needed
        await unifiedRemote.exec(`
            CREATE TABLE IF NOT EXISTS profile (id INTEGER PRIMARY KEY, name TEXT, title TEXT, email TEXT, phone TEXT, bio TEXT);
            CREATE TABLE IF NOT EXISTS projects (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, client TEXT, status TEXT, progress INTEGER, dueDate TEXT);
            CREATE TABLE IF NOT EXISTS project_tasks (id INTEGER PRIMARY KEY AUTOINCREMENT, project_id INTEGER, title TEXT, description TEXT, status TEXT, assigned_to TEXT, FOREIGN KEY (project_id) REFERENCES projects(id));
            CREATE TABLE IF NOT EXISTS education (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, institution TEXT, year TEXT, type TEXT, status TEXT);
            CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, password TEXT, role TEXT, email TEXT UNIQUE, phone TEXT, bio TEXT, title TEXT, avatarBase64 TEXT);
            CREATE TABLE IF NOT EXISTS audit_logs (id INTEGER PRIMARY KEY AUTOINCREMENT, user_name TEXT, action TEXT, entity TEXT, details TEXT, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP);
            CREATE TABLE IF NOT EXISTS fundamentals (id INTEGER PRIMARY KEY AUTOINCREMENT, type TEXT, category TEXT, title TEXT, description TEXT, url TEXT);
            CREATE TABLE IF NOT EXISTS course_modules (id INTEGER PRIMARY KEY AUTOINCREMENT, education_id INTEGER, title TEXT, video_url TEXT);
            CREATE TABLE IF NOT EXISTS course_resources (id INTEGER PRIMARY KEY AUTOINCREMENT, education_id INTEGER, name TEXT, url TEXT);
        `);

        // Check for users, seed if absolutely empty
        const userCheck = await unifiedRemote.exec({ sql: "SELECT count(*) as count FROM users", returnValue: 'resultRows' });
        if (userCheck[0].count === 0) {
          console.log('Seeding initial remote users...');
          await unifiedRemote.exec(`
                INSERT OR IGNORE INTO users (id, name, password, role, email, phone, bio, title) VALUES 
                (1, 'Administrador', 'admin', 'Super admin', 'admin@intezia.com', '+1 555 000 0000', 'Administrador principal del sistema.', 'Director General'),
                (2, 'Jean Valery', '123456', 'Super admin', 'jean@intezia.com', '+1 555 111 2222', 'Estratega de negocios y consultor senior.', 'CEO & Partner');
            `);
        }

        dbInstance = unifiedRemote;
        return dbInstance;
      }

      // Fallback to Local WASM
      console.log('Using Local SQLite WASM (OPFS fallback)...');
      const sqlite3 = await sqlite3InitModule();
      let localDb;
      if ('opfs' in sqlite3.oo1.DB) {
        localDb = new sqlite3.oo1.OpfsDb('/consultant_app_v5.sqlite3');
      } else {
        localDb = new sqlite3.oo1.DB('/consultant_app_v5.sqlite3', 'ct');
      }

      const unifiedLocal: UnifiedDB = {
        type: 'local',
        exec: (options) => {
          if (typeof options === 'string') {
            return localDb.exec(options);
          }
          return localDb.exec({
            sql: options.sql,
            bind: options.bind,
            returnValue: options.returnValue as any,
            rowMode: options.rowMode as any
          });
        }
      };

      // Initialize Schema Local
      unifiedLocal.exec(`
        CREATE TABLE IF NOT EXISTS profile (id INTEGER PRIMARY KEY, name TEXT, title TEXT, email TEXT, phone TEXT, bio TEXT);
        CREATE TABLE IF NOT EXISTS projects (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, client TEXT, status TEXT, progress INTEGER, dueDate TEXT);
        CREATE TABLE IF NOT EXISTS project_tasks (id INTEGER PRIMARY KEY AUTOINCREMENT, project_id INTEGER, title TEXT, description TEXT, status TEXT, assigned_to TEXT, FOREIGN KEY (project_id) REFERENCES projects(id));
        CREATE TABLE IF NOT EXISTS education (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, institution TEXT, year TEXT, type TEXT, status TEXT);
        CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT UNIQUE, password TEXT, role TEXT, email TEXT UNIQUE, phone TEXT, bio TEXT, title TEXT, avatarBase64 TEXT);
        CREATE TABLE IF NOT EXISTS audit_logs (id INTEGER PRIMARY KEY AUTOINCREMENT, user_name TEXT, action TEXT, entity TEXT, details TEXT, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP);
        CREATE TABLE IF NOT EXISTS fundamentals (id INTEGER PRIMARY KEY AUTOINCREMENT, type TEXT, category TEXT, title TEXT, description TEXT, url TEXT);
        CREATE TABLE IF NOT EXISTS course_modules (id INTEGER PRIMARY KEY AUTOINCREMENT, education_id INTEGER, title TEXT, video_url TEXT);
        CREATE TABLE IF NOT EXISTS course_resources (id INTEGER PRIMARY KEY AUTOINCREMENT, education_id INTEGER, name TEXT, url TEXT);
      `);

      dbInstance = unifiedLocal;
      return dbInstance;
    } catch (err: any) {
      console.error("Database initialization failed:", err);
      initPromise = null;
      throw err;
    }
  })();
  return initPromise;
};

export const getDb = (): UnifiedDB => {
  if (!dbInstance) {
    console.warn('Database accessed before initialization. This might cause issues.');
  }
  return dbInstance || {
    type: 'local',
    exec: () => { throw new Error('Database not ready. Please wait for initialization.'); }
  };
};

export const getOrInitDB = async (): Promise<UnifiedDB> => {
  if (dbInstance) return dbInstance;
  return await initDB();
};

export const logAction = async (user_name: string, action: string, entity: string, details: string) => {
  try {
    const db = await getOrInitDB();
    await db.exec({
      sql: 'INSERT INTO audit_logs (user_name, action, entity, details) VALUES (?, ?, ?, ?)',
      bind: [user_name, action, entity, details]
    });
  } catch (err) {
    console.error('Failed to log action:', err);
  }
};
