-- Definición de Esquema para Intezia Connect

-- Perfil del Consultor (Tabla única)
CREATE TABLE IF NOT EXISTS profile (
    id INTEGER PRIMARY KEY,
    name TEXT,
    title TEXT,
    email TEXT,
    phone TEXT,
    bio TEXT
);

-- Proyectos
CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    client TEXT,
    status TEXT,
    progress INTEGER,
    dueDate TEXT
);

-- Tareas de Proyecto
CREATE TABLE IF NOT EXISTS project_tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER,
    title TEXT,
    description TEXT,
    status TEXT,
    assigned_to TEXT,
    FOREIGN KEY (project_id) REFERENCES projects(id)
);

-- Educación
CREATE TABLE IF NOT EXISTS education (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    institution TEXT,
    year TEXT,
    type TEXT,
    status TEXT
);

-- Módulos de Curso
CREATE TABLE IF NOT EXISTS course_modules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    education_id INTEGER,
    title TEXT,
    video_url TEXT,
    FOREIGN KEY (education_id) REFERENCES education(id)
);

-- Recursos de Curso
CREATE TABLE IF NOT EXISTS course_resources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    education_id INTEGER,
    name TEXT,
    url TEXT,
    FOREIGN KEY (education_id) REFERENCES education(id)
);

-- Usuarios y Accesos
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    password TEXT,
    role TEXT,
    email TEXT UNIQUE,
    phone TEXT,
    bio TEXT,
    title TEXT,
    avatarBase64 TEXT
);

-- Auditoría (Logs)
CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_name TEXT,
    action TEXT,
    entity TEXT,
    details TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Fundamentos
CREATE TABLE IF NOT EXISTS fundamentals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT,
    category TEXT,
    title TEXT,
    description TEXT,
    url TEXT
);
