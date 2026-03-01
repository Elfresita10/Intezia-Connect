// scripts/fix-turso-users.ts
import { createClient } from '@libsql/client';
import 'dotenv/config';

async function fix() {
  console.log("--- Iniciando Reestablecimiento de Usuarios ---");

  const dbUrl = process.env.VITE_DB_URL;
  const dbToken = process.env.VITE_DB_AUTH_TOKEN;

  if (!dbUrl || !dbToken) {
    console.error("❌ Error: Faltan credenciales en el .env (VITE_DB_URL o VITE_DB_AUTH_TOKEN)");
    return;
  }

  // Normalizar URL: libsql:// -> https:// para evitar problemas 400 en algunos entornos HTTP
  const normalizedUrl = dbUrl.startsWith("libsql://")
    ? dbUrl.replace("libsql://", "https://")
    : dbUrl;

  console.log(`Conectando a: ${normalizedUrl}`);
  const client = createClient({ url: normalizedUrl, authToken: dbToken });

  try {
    // 0. Test conexión
    console.log("⏳ Verificando conexión...");
    await client.execute({ sql: "SELECT 1", args: [] });
    console.log("✅ Conexión establecida.");

    // 1. Borrar tabla problemática
    console.log("⏳ Borrando tabla de usuarios antigua...");
    await client.execute({ sql: "DROP TABLE IF EXISTS users", args: [] });

    // 2. Crear tabla con esquema robusto
    console.log("⏳ Creando nueva tabla de usuarios...");
    await client.execute({
      sql: `CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        password TEXT,
        role TEXT,
        email TEXT UNIQUE,
        phone TEXT,
        bio TEXT,
        title TEXT,
        avatarBase64 TEXT
      )`,
      args: []
    });

    // 3. Re-insertar usuarios base
    console.log("⏳ Insertando usuarios administrativos iniciales...");
    await client.execute({
      sql: `INSERT INTO users (id, name, password, role, email, phone, bio, title) VALUES 
      (1, 'Administrador', 'admin', 'Super admin', 'admin@intezia.com', '+1 555 000 0000', 'Administrador principal del sistema.', 'Director General'),
      (1, 'Guillermo', '123456', 'Super admin', 'guillermo@intezia.com', '+1 555 000 0000', 'Administrador principal del sistema.', 'Product Manager'),
      (2, 'Jean Valery', '123456', 'Super admin', 'jean@intezia.com', '+1 555 111 2222', 'Estratega de negocios y consultor senior.', 'CEO & Partner')`,
      args: []
    });

    console.log("--- ✨ ¡ÉXITO! La base de datos ha sido limpiada y reparada ---");
  } catch (e: any) {
    console.error("❌ Error durante la reparación:");
    console.error(e.message || e);
    if (e.cause) console.error("Causa:", e.cause.message || e.cause);
  }
}

fix();
