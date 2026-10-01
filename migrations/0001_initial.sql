CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('admin','editor')),
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS works (
  id TEXT PRIMARY KEY,
  work_date TEXT NOT NULL,
  editor_id TEXT NOT NULL,
  studio TEXT NOT NULL,
  project TEXT NOT NULL,
  work_type TEXT NOT NULL,
  price REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Pending' CHECK(status IN ('Pending','In Progress','Completed')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (editor_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_works_date ON works(work_date);
CREATE INDEX IF NOT EXISTS idx_works_editor ON works(editor_id);
CREATE INDEX IF NOT EXISTS idx_works_status ON works(status);
