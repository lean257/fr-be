const db = require("./db");

function getUserById(id) {
  const data = db.query(`SELECT * FROM users WHERE id = ?`, [id]);
  return data;
}
module.exports = {
  getUserById,
};
