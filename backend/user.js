/**
 * User model contains info for each customer
 */
class User {
  constructor(db) {
    this.db = db;
  }
  createTable() {
    const sql = `
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name text)`;
    return this.db.run(sql);
  }
  createUser(name) {
    return this.db.run("INSERT INTO users (name) VALUES (?)", [name]);
  }

  getById(id) {
    return this.db.get(`SELECT * FROM users WHERE id = ?`, [id]);
  }
}

module.exports = User;
