var sqlite3 = require("sqlite3").verbose();

class Database {
  constructor(dbFilePath) {
    this.db = new sqlite3.Database(dbFilePath, (err) => {
      if (err) {
        // Cannot open database
        console.error("Error opening database " + err.message);
        throw err;
      } else {
        console.log("Connected to database.");
      }
    });
  }

  async run(sql, params = []) {
    try {
      await this.db.run(sql, params);
    } catch (err) {
      console.error("error running sql " + sql);
      console.error(err);
    }
  }

  async get(sql, params = []) {
    try {
      await this.db.get(sql, params);
    } catch (err) {
      console.error("error running sql " + sql);
      console.error(err);
    }
  }
}
module.exports = Database;
