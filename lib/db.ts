import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export const PRIORITIES = ['high', 'medium', 'low'] as const;
export type Priority = (typeof PRIORITIES)[number];

export const RECURRENCE_PATTERNS = ['daily', 'weekly', 'monthly', 'yearly'] as const;
export type RecurrencePattern = (typeof RECURRENCE_PATTERNS)[number];

/** 15m, 30m, 1h, 2h, 1d, 2d, 1w */
export const REMINDER_MINUTES = [15, 30, 60, 120, 1440, 2880, 10080] as const;
export type ReminderMinutes = (typeof REMINDER_MINUTES)[number];

export interface User {
  id: number;
  username: string;
  created_at: string;
}

export interface Authenticator {
  id: number;
  user_id: number;
  credential_id: string; // isoBase64URL
  credential_public_key: Buffer;
  counter: number;
  transports: string | null; // JSON array of AuthenticatorTransport
  created_at: string;
}

export interface Session {
  userId: number;
  username: string;
}

export interface Todo {
  id: number;
  user_id: number;
  title: string;
  completed: boolean;
  due_date: string | null; // Singapore-local ISO
  priority: Priority;
  is_recurring: boolean;
  recurrence_pattern: RecurrencePattern | null;
  reminder_minutes: ReminderMinutes | null;
  last_notification_sent: string | null;
  created_at: string;
  updated_at: string;
  subtasks?: Subtask[];
  tags?: Tag[];
}

export interface Subtask {
  id: number;
  todo_id: number;
  title: string;
  completed: boolean;
  position: number;
  created_at: string;
}

export interface Tag {
  id: number;
  user_id: number;
  name: string;
  color: string;
  created_at: string;
}

export interface TemplateSubtask {
  title: string;
  position: number;
}

export interface Template {
  id: number;
  user_id: number;
  name: string;
  description: string | null;
  category: string | null;
  title_template: string;
  priority: Priority;
  is_recurring: boolean;
  recurrence_pattern: RecurrencePattern | null;
  reminder_minutes: ReminderMinutes | null;
  due_date_offset_minutes: number | null;
  subtasks_json: string; // JSON TemplateSubtask[]
  created_at: string;
  updated_at: string;
}

export interface Holiday {
  id: number;
  date: string; // YYYY-MM-DD
  name: string;
}

/* Raw SQLite rows store booleans as 0/1. */
export type TodoRow = Omit<Todo, 'completed' | 'is_recurring' | 'subtasks' | 'tags'> & {
  completed: number;
  is_recurring: number;
};
export type SubtaskRow = Omit<Subtask, 'completed'> & { completed: number };
export type TemplateRow = Omit<Template, 'is_recurring'> & { is_recurring: number };

export const toTodo = (row: TodoRow): Todo => ({
  ...row,
  completed: row.completed === 1,
  is_recurring: row.is_recurring === 1,
});
export const toSubtask = (row: SubtaskRow): Subtask => ({ ...row, completed: row.completed === 1 });
export const toTemplate = (row: TemplateRow): Template => ({
  ...row,
  is_recurring: row.is_recurring === 1,
});

/* ------------------------------------------------------------------ */
/* Schema                                                              */
/* ------------------------------------------------------------------ */

const inList = (values: readonly (string | number)[]) =>
  values.map((v) => (typeof v === 'string' ? `'${v}'` : v)).join(', ');

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  username    TEXT NOT NULL UNIQUE,
  created_at  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS authenticators (
  id                     INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id                INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  credential_id          TEXT NOT NULL UNIQUE,
  credential_public_key  BLOB NOT NULL,
  counter                INTEGER NOT NULL DEFAULT 0,
  transports             TEXT,
  created_at             TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS todos (
  id                      INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id                 INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title                   TEXT NOT NULL,
  completed               INTEGER NOT NULL DEFAULT 0 CHECK (completed IN (0, 1)),
  due_date                TEXT,
  priority                TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN (${inList(PRIORITIES)})),
  is_recurring            INTEGER NOT NULL DEFAULT 0 CHECK (is_recurring IN (0, 1)),
  recurrence_pattern      TEXT CHECK (recurrence_pattern IS NULL OR recurrence_pattern IN (${inList(RECURRENCE_PATTERNS)})),
  reminder_minutes        INTEGER CHECK (reminder_minutes IS NULL OR reminder_minutes IN (${inList(REMINDER_MINUTES)})),
  last_notification_sent  TEXT,
  created_at              TEXT NOT NULL,
  updated_at              TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_todos_user ON todos(user_id);

CREATE TABLE IF NOT EXISTS subtasks (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  todo_id     INTEGER NOT NULL REFERENCES todos(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  completed   INTEGER NOT NULL DEFAULT 0 CHECK (completed IN (0, 1)),
  position    INTEGER NOT NULL,
  created_at  TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_subtasks_todo ON subtasks(todo_id);

CREATE TABLE IF NOT EXISTS tags (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL COLLATE NOCASE,
  color       TEXT NOT NULL DEFAULT '#3B82F6',
  created_at  TEXT NOT NULL,
  UNIQUE (user_id, name)
);
CREATE INDEX IF NOT EXISTS idx_tags_user ON tags(user_id);

CREATE TABLE IF NOT EXISTS todo_tags (
  todo_id  INTEGER NOT NULL REFERENCES todos(id) ON DELETE CASCADE,
  tag_id   INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (todo_id, tag_id)
);
CREATE INDEX IF NOT EXISTS idx_todo_tags_tag ON todo_tags(tag_id);

CREATE TABLE IF NOT EXISTS templates (
  id                       INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id                  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name                     TEXT NOT NULL,
  description              TEXT,
  category                 TEXT,
  title_template           TEXT NOT NULL,
  priority                 TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN (${inList(PRIORITIES)})),
  is_recurring             INTEGER NOT NULL DEFAULT 0 CHECK (is_recurring IN (0, 1)),
  recurrence_pattern       TEXT CHECK (recurrence_pattern IS NULL OR recurrence_pattern IN (${inList(RECURRENCE_PATTERNS)})),
  reminder_minutes         INTEGER CHECK (reminder_minutes IS NULL OR reminder_minutes IN (${inList(REMINDER_MINUTES)})),
  due_date_offset_minutes  INTEGER,
  subtasks_json            TEXT NOT NULL DEFAULT '[]',
  created_at               TEXT NOT NULL,
  updated_at               TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_templates_user ON templates(user_id);

CREATE TABLE IF NOT EXISTS holidays (
  id    INTEGER PRIMARY KEY AUTOINCREMENT,
  date  TEXT NOT NULL UNIQUE,
  name  TEXT NOT NULL
);
`;

/* ------------------------------------------------------------------ */
/* Connection (singleton, survives dev hot reloads)                    */
/* ------------------------------------------------------------------ */

function openDatabase(): Database.Database {
  const file = path.resolve(process.env.DATABASE_PATH ?? 'data/todos.db');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = new Database(file);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.exec(SCHEMA);
  return db;
}

const globalForDb = globalThis as unknown as { __todoDb?: Database.Database };

export const db: Database.Database = globalForDb.__todoDb ?? openDatabase();
if (process.env.NODE_ENV !== 'production') globalForDb.__todoDb = db;

export default db;
