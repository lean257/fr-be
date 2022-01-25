/**
 * Account model contains account info that is related to user
 */
class Account {
  constructor(db) {
    this.db = db;
  }
  createTable() {
    const sql = `
        CREATE TABLE IF NOT EXISTS accounts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                uid INTEGER)`;
    return this.db.run(sql);
  }
  // create new account based on userId
  createAccount(uid, amount) {
    return this.db.run("INSERT INTO accounts (uid, amount) VALUES (?)", [
      uid,
      amount,
    ]);
  }
}
module.exports = Account;
