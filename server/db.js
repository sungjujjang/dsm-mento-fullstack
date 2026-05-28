import sqlite3 from "sqlite3";

const db = new sqlite3.Database("./server/data/data.db");

export function initDb(callback) {
  db.run(
    `CREATE TABLE IF NOT EXISTS memos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT,
      pinned INTEGER DEFAULT 0,
      image_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    callback
  );
}

export function createMemo(title, content, image_url, callback) {
  const done = typeof image_url === "function" ? image_url : callback;
  const imageUrl = typeof image_url === "function" ? null : image_url;

  db.run(
    "INSERT INTO memos (title, content, image_url) VALUES (?, ?, ?)",
    [title, content, imageUrl ?? null],
    function (err) {
      done(err, this?.lastID);
    }
  );
}

export function getMemos(callback) {
  db.all("SELECT * FROM memos ORDER BY id DESC", callback);
}

export function getMemosWithOptions(options, callback) {
  const limit = options?.limit ?? 100;
  const sort = options?.sort === "ASC" ? "ASC" : "DESC";
  const keyword = options?.q?.trim();
  const params = [];
  const where = keyword ? "WHERE title LIKE ? OR content LIKE ?" : "";

  if (keyword) {
    const pattern = `%${keyword}%`;
    params.push(pattern, pattern);
  }

  params.push(limit);

  db.all(
    `SELECT * FROM memos ${where} ORDER BY pinned DESC, id ${sort} LIMIT ?`,
    params,
    callback
  );
}

export function getMemoById(id, callback) {
  db.get("SELECT * FROM memos WHERE id = ?", [id], callback);
}

export function deleteMemoById(index, callback) {
  db.run("DELETE FROM memos WHERE id = ?", [index], function (err) {
    callback(err, this?.changes ?? 0);
  });
}

export function updateMemoById(id, { title, content, pinned, image_url }, callback) {
  db.run(
    `UPDATE memos
     SET title = ?,
         content = ?,
         pinned = ?,
         image_url = ?,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [title, content, pinned ? 1 : 0, image_url ?? null, id],
    function (err) {
      callback(err, this?.changes ?? 0);
    }
  );
}

export function toggleMemoPinById(id, callback) {
  db.run(
    `UPDATE memos
     SET pinned = CASE WHEN pinned = 1 THEN 0 ELSE 1 END,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [id],
    function (err) {
      callback(err, this?.changes ?? 0);
    }
  );
}

export default db;
