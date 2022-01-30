const sqlite = require("better-sqlite3");
const path = require("path");
// const db = new sqlite(path.resolve("db.sqlite3"), { fileMustExist: true });
const sqlite3 = require("sqlite3").verbose();
const DBSOURCE = "db.sqlite3";
const {
  sql_create_accounts,
  sql_create_customers,
  sql_create_transfer,
  sql_create_movement,
  trigger1,
  trigger2,
  trigger3,
  trigger4,
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

function run(sql, params) {
  return db.run(sql, params);
}

// create and seed customers table
db.run(sql_create_customers, (err) => {
  if (err) {
    return console.error(err.message);
  }
  console.log("Successful creation of the 'Customers' table");
  // seed customers DB after table created
  const sql_insert = `INSERT INTO customers (name) VALUES ('Arisha Barron'),('Branden Gibson'),('Rhonda Church'),('Georgina Hazel')`;
  db.run(sql_insert, (err) => {
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
  console.log("successfully inserted accounts");
  // index customer_id & balance
  const sql_query = `
  CREATE UNIQUE INDEX idx_customer_id ON accounts(customer_id);
  CREATE UNIQUE INDEX idx_balance ON accounts(balance);`;
});
// transfer table records details of the transfer
db.run(sql_create_transfer, (err) => {
  if (err) {
    console.log("problems creating transfer table " + err.message);
    return;
  }
  console.log("successfully created transfer table");
});

// movement table records money in and out of a particular account
db.run(sql_create_movement, (err) => {
  if (err) {
    console.log("problems creating movement table " + err.message);
    return;
  }
  console.log("successfully created movement");
});
// triggers to update balance on changes in movement

db.run(trigger1, (err) => {
  if (err) {
    console.log("running trigger1 " + err.message);
    return;
  }
  console.log("successfully run trigger1");
});
db.run(trigger2, (err) => {
  if (err) {
    console.log("running trigger1 " + err.message);
    return;
  }
  console.log("successfully run trigger1");
});
db.run(trigger3, (err) => {
  if (err) {
    console.log("running trigger1 " + err.message);
    return;
  }
  console.log("successfully run trigger1");
});
db.run(trigger4, (err) => {
  if (err) {
    console.log("running trigger1 " + err.message);
    return;
  }
  console.log("successfully run trigger1");
});
module.exports = {
  run,
};
