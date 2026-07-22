import { drizzle } from 'drizzle-orm/better-sqlite3'
import Database from 'better-sqlite3'
import * as schema from '../database/schema'
import path from 'path'

const dbPath = path.resolve(process.cwd(), 'sqlite.db')
const sqlite = new Database(dbPath)

// Activer les clés étrangères pour SQLite
sqlite.pragma('foreign_keys = ON')

export const db = drizzle(sqlite, { schema })
export { schema }
