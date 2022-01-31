const sqlite3 = require("sqlite3").verbose();
const DBSOURCE = "db.sqlite3";
const {
  sql_create_accounts,
  sql_create_customers,
  sql_create_transfer,
  sql_create_movement,
  trigger_update_balance,
} = require("../dbprompts");

let db = new sqlite3.Database(DBSOURCE, (err) => {
  if (err) {
    // Cannot open database
    console.error("Error opening database " + err.message);
    throw err;
  } else {
    console.log("Connected to database.");
  }
});

// create and seed customers table
db.run(sql_create_customers, (err) => {
  if (err) {
    return console.error(err.message);
  }
  console.log("Successfully created Customers table");
  // seed customers DB after table created
  const sql_insert = `INSERT INTO customers (name) VALUES ('Arisha Barron'),('Branden Gibson'),('Rhonda Church'),('Georgina Hazel')`;
  db.run(sql_insert, async (err) => {
    if (err) {
      console.log("problems inserting new customers " + err.message);
      return;
    }
    console.log("successfully inserted customers");
  });
});
// create accounts table
// index customer_id, balance columns
db.run(sql_create_accounts, (err) => {
  if (err) {
    console.log("problems creating accounts table " + err.message);
    return;
  }
  console.log("successfully create accounts table");
});
// transfer table records details of the transfer
// movement table records money in and out of a particular account
// triggers to update balance on changes in movement
db.serialize(() => {
  db.run(sql_create_movement);
  db.run(sql_create_transfer);
  db.run(trigger_update_balance);
});

module.exports = db;
