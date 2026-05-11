import Database from 'better-sqlite3'
import { existsSync, mkdirSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const dbPath = join(__dirname, 'data.db')

// Ensure uploads directory exists
const uploadsDir = join(__dirname, 'uploads')
if (!existsSync(uploadsDir)) mkdirSync(uploadsDir, { recursive: true })

const db = new Database(dbPath)
db.pragma('journal_mode = WAL')

db.exec(`
  CREATE TABLE IF NOT EXISTS overview (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    contractor TEXT NOT NULL,
    location TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    progress REAL NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS staff (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project TEXT NOT NULL,
    name TEXT NOT NULL,
    position TEXT NOT NULL,
    phone TEXT NOT NULL,
    idCard TEXT NOT NULL,
    cert TEXT DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS supervisors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project TEXT NOT NULL,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    attendance INTEGER DEFAULT 0,
    lastCheckIn TEXT DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS risks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project TEXT NOT NULL,
    description TEXT NOT NULL,
    discoverTime TEXT DEFAULT '',
    discoverPlace TEXT DEFAULT '',
    level TEXT NOT NULL,
    photo TEXT DEFAULT '',
    measure TEXT DEFAULT '',
    processed INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS quality (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project TEXT NOT NULL,
    date TEXT DEFAULT '',
    rebarPhoto TEXT DEFAULT '',
    rebarContent TEXT DEFAULT '',
    wiringPhoto TEXT DEFAULT '',
    wiringContent TEXT DEFAULT '',
    equipmentPhoto TEXT DEFAULT '',
    equipmentContent TEXT DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS hazards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project TEXT NOT NULL,
    name TEXT NOT NULL,
    location TEXT DEFAULT '',
    hazardType TEXT NOT NULL,
    possibleAccident TEXT DEFAULT '',
    controlMeasure TEXT DEFAULT '',
   level TEXT NOT NULL,
   photo TEXT DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS preshift (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project TEXT NOT NULL,
    date TEXT DEFAULT '',
    host TEXT DEFAULT '',
    status TEXT DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS device_inspections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project TEXT NOT NULL,
    deviceName TEXT NOT NULL,
    checkContent TEXT DEFAULT '',
    foundRisk TEXT DEFAULT '',
    warrantyStatus TEXT DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project TEXT NOT NULL,
    filename TEXT NOT NULL,
    mimetype TEXT NOT NULL,
    data BLOB NOT NULL,
    uploadTime TEXT DEFAULT '',
    category TEXT DEFAULT '其他文件'
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    real_name TEXT NOT NULL DEFAULT '',
    phone TEXT NOT NULL DEFAULT '',
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
  );
`)

// Migrate existing files table to add category column if it doesn't exist
try {
  const columns = db.prepare("PRAGMA table_info(files)").all()
  const hasCategory = columns.some(col => col.name === 'category')
  if (!hasCategory) {
    db.exec("ALTER TABLE files ADD COLUMN category TEXT DEFAULT '其他文件'")
    console.log('✓ Added category column to files table')
  }
  db.exec("UPDATE files SET category = '其他文件' WHERE category IS NULL OR TRIM(category) = ''")
} catch (err) {
  console.error('Migration error:', err)
}

try {
  const columns = db.prepare("PRAGMA table_info(risks)").all()
  const hasProcessed = columns.some(col => col.name === 'processed')
  if (!hasProcessed) {
    db.exec("ALTER TABLE risks ADD COLUMN processed INTEGER NOT NULL DEFAULT 0")
    console.log('✓ Added processed column to risks table')
  }
  db.exec('UPDATE risks SET processed = 0 WHERE processed IS NULL')
  const hasWorkflowStep = columns.some(col => col.name === 'workflowStep')
  if (!hasWorkflowStep) {
    db.exec("ALTER TABLE risks ADD COLUMN workflowStep INTEGER NOT NULL DEFAULT 0")
    console.log('✓ Added workflowStep column to risks table')
  }
} catch (err) {
  console.error('Risk migration error:', err)
}

try {
  const columns = db.prepare("PRAGMA table_info(users)").all()
  const hasIsAdmin = columns.some(col => col.name === 'is_admin')
  if (!hasIsAdmin) {
    db.exec("ALTER TABLE users ADD COLUMN is_admin INTEGER NOT NULL DEFAULT 0")
    console.log('✓ Added is_admin column to users table')
  }
  const hasRole = columns.some(col => col.name === 'role')
  if (!hasRole) {
    db.exec("ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT ''")
    console.log('✓ Added role column to users table')
  }
  const hasAssignedProject = columns.some(col => col.name === 'assigned_project')
  if (!hasAssignedProject) {
    db.exec("ALTER TABLE users ADD COLUMN assigned_project TEXT NOT NULL DEFAULT ''")
    console.log('✓ Added assigned_project column to users table')
  }
} catch (err) {
  console.error('Users migration error:', err)
}

// 迁移：hazards 表补充 photo 列
try {
  const cols = db.prepare("PRAGMA table_info(hazards)").all()
  if (!cols.some(c => c.name === 'photo')) {
    db.exec("ALTER TABLE hazards ADD COLUMN photo TEXT DEFAULT ''")
    console.log('✓ Added photo column to hazards table')
  }
} catch (err) {
  console.error('Hazards migration error:', err)
}

// 迁移：device_inspections 表补充 photo 列
try {
  const cols = db.prepare("PRAGMA table_info(device_inspections)").all()
  if (!cols.some(c => c.name === 'photo')) {
    db.exec("ALTER TABLE device_inspections ADD COLUMN photo TEXT DEFAULT ''")
    console.log('✓ Added photo column to device_inspections table')
  }
} catch (err) {
  console.error('Device inspections migration error:', err)
}

/**
 * Save a base64 data-URL image to the uploads directory.
 * Returns the public path (e.g. /uploads/xxx.jpg).
 * If the input is already a path or empty, it is returned unchanged.
 */
export function saveBase64Photo(base64Str) {
  if (!base64Str) return ''
  if (!base64Str.startsWith('data:')) return base64Str
  const match = base64Str.match(/^data:image\/([^;]+);base64,(.+)$/)
  if (!match) return ''
  const ext = match[1] === 'jpeg' ? 'jpg' : match[1]
  const data = Buffer.from(match[2], 'base64')
  const filename = Date.now() + '-' + Math.random().toString(36).slice(2, 10) + '.' + ext
  writeFileSync(join(uploadsDir, filename), data)
  return '/uploads/' + filename
}

export default db
