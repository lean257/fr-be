const express = require("express");
const app = express();
const Database = require("./db.js");
const port = 8000;
const DBSOURCE = "db.sqlite3";
const sqlite3 = require("sqlite3").verbose();

// const db = new Database(DBSOURCE);
// const UserModel = require("./user");
// const User = new UserModel(db);
// const AccountModel = require("./account");
// const Account = new AccountModel(db);
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
let db = new sqlite3.Database(DBSOURCE, (err) => {
  if (err) {
    // Cannot open database
    console.error("Error opening database " + err.message);
    throw err;
  } else {
    console.log("Connected to database.");
  }
});
// create necessary tables
const sql_create = `
        CREATE TABLE IF NOT EXISTS customers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            phone TEXT,
            email TEXT,
            date_became_customer TEXT,
            login TEXT,
            password TEXT,
            customer_type TEXT)`;
db.run(sql_create, (err) => {
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
// index customer_id, balance for query
const sql_create_accounts = `
CREATE TABLE IF NOT EXISTS accounts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id INTEGER,
        date_opened TEXT,
        date_closed TEXT,
        account_type TEXT,
        initial_balance INTEGER,
        currency_id TEXT,
        FOREIGN KEY (customer_id)
        REFERENCES customers (id)
            ON UPDATE CASCADE
            ON DELETE CASCADE
        FOREIGN KEY (balance)
        REFERENCES transactions (current_balance)
            ON UPDATE CASCADE
            ON DELETE CASCADE
        )`;
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
const sql_create_transfer = `
CREATE TABLE IF NOT EXISTS transfers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        from_id INTEGER REFERENCES accounts (id),
        to_id INTEGER REFERENCES accounts (id),
        amount INTEGER,
        )`;
// movement table records money in and out of a particular account

const sql_create_movement = `
CREATE TABLE IF NOT EXISTS movement (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date_of_transfer TEXT NOT NULL,
        account_id INTEGER REFERENCES accounts (id),
        transfer_id INTEGER REFERENCES transfers (id),
        amount INTEGER,
        current_balance INTEGER,
        transaction_type_code TEXT,
        )`;
const sql_movement_idx = `
CREATE INDEX movent_idx01 ON movement (account_id, payment, id);`;
db.run(sql_create_movement, (err) => {
  if (err) {
    console.log("problems creating movement table " + err.message);
    return;
  }
  console.log("successfully created movement");
});
// triggers to update balance on changes in movement
// trigger on delete
const trigger1 = `
DROP TRIGGER IF EXISTS movement_trg01;
CREATE TRIGGER movement_trg01 AFTER DELETE ON movement FOR EACH ROW 
BEGIN 
UPDATE movement 
SET balance = balance - old.amount 
WHERE account_id = old.account_id 
AND (date_of_transfer > old.date_of_transfer 
OR (+date_of_transfer = +old.date_of_transfer 
AND id > old.id)); 
END; 
`;
// trigger on insert
const trigger2 = `
DROP TRIGGER IF EXISTS movement_trg02; 
CREATE TRIGGER movement_trg02 AFTER INSERT ON movement FOR EACH ROW 
BEGIN 
REPLACE INTO movement 
SELECT t1.id 
, t1.account_id 
, t1.payment 
, t1.amount 
, (COALESCE((SELECT balance 
FROM movement s1 
WHERE s1.account_id = t1.account_id 
AND (s1.date_of_transfer < t1.date_of_transfer 
OR (+s1.date_of_transfer = +t1.date_of_transfer 
AND s1.id < t1.id)) 
GROUP BY s1.account_id 
HAVING +s1.date_of_transfer = MAX(+s1.date_of_transfer) 
AND s1.id = MAX(s1.id)), 0) 
+ t1.amount) AS balance 
FROM movement t1 
WHERE id = new.id
UPDATE movement 
SET balance = balance + new.amount 
WHERE account_id = new.account_id 
AND +date_of_transfer >= +new.date_of_transfer 
AND id > new.id; 
END;
; 
`;
// trigger on update when account_id or date not changed
const trigger3 = `
DROP TRIGGER IF EXISTS movement_trg03; 
CREATE TRIGGER movement_trg03 AFTER UPDATE ON movement FOR EACH ROW WHEN 
((old.account_id == new.account_id) AND (+old.date_of_transfer == +new.date_of_transfer) AND 
(new.amount != old.amount)) 
BEGIN 
UPDATE movement 
SET balance = balance + (new.amount - old.amount) 
WHERE account_id = old.account_id 
AND (date_of_transfer > old.date_of_transfer 
OR (+date_of_transfer = +old.date_of_transfer 
AND id >= old.id)); 
END;
`;
// trigger on insert when account_id or payment changed
const trigger4 = `
DROP TRIGGER IF EXISTS movement_trg03; 
CREATE TRIGGER movement_trg03 AFTER UPDATE ON movement FOR EACH ROW WHEN 
(((old.account_id != new.account_id) OR (old.date_of_transfer != new.date_of_transfer)) AND 
(new.amount != old.amount)) 
BEGIN 
-- same code as delete trigger 
UPDATE movement 
SET balance = balance - old.amount 
WHERE account_id = old.account_id 
AND (date_of_transfer > old.date_of_transfer 
OR (date_of_transfer = old.date_of_transfer 
AND id > old.id)); 
-- same code as insert 
REPLACE INTO movement 
SELECT t1.id 
, t1.account_id 
, t1.date_of_transfer 
, t1.amount 
, (COALESCE((SELECT balance 
FROM movement s1 
WHERE s1.account_id = t1.account_id 
AND (s1.date_of_transfer < t1.date_of_transfer 
OR (s1.date_of_transfer = t1.date_of_transfer 
AND s1.id < t1.id)) 
GROUP BY s1.account_id 
HAVING s1.date_of_transfer = MAX(s1.date_of_transfer) 
AND s1.id = MAX(s1.id)), 0) 
+ t1.amount) AS balance 
FROM movement t1 
WHERE id = new.id; 

UPDATE movement 
SET balance = balance + new.amount 
WHERE account_id = new.account_id 
AND date_of_transfer >= new.date_of_transfer 
AND id > new.id; 
END; 
`;
// needs to do Promise.all to run all triggers
db.run(trigger1, (err) => {
  if (err) {
    console.log("running trigger1 " + err.message);
    return;
  }
  console.log("successfully run trigger1");
});
app.get("/", (req, res) => {
  res.send("Please refer to instructions");
});
// get user by id
app.get("/api/users/:id", async (req, res) => {
  try {
    const sql = `SELECT * FROM users WHERE id = ?`;
    const { id } = req.params;
    const result = db.get(sql, id);
    res.json({
      message: `successfully retreived user ${id}`,
      data: result.row,
    });
  } catch (err) {
    console.error("error retrieving user " + err.message);
  }
});
// create new bank accounts
app.post("/api/accounts", async (req, res) => {
  try {
    // grab user, initial deposit amount from the body
    let { customer_id, deposit } = req.body;

    // update accounts table
    db.run(
      `INSERT INTO accounts (date_opened, customer_id, initial_balance) VALUES (?,?,?)
      `,
      [Date.now(), customer_id, deposit]
    );
    const account_id = db.run(`SELECT last_insert_rowid()`);

    // send confirmation
    res.json({
      message: `account created successfully for customer ${customer_id}`,
    });
  } catch (err) {
    return console.error("error creating new account: " + err.message);
  }
});
// retrieve balance for a given account
app.get("/api/accounts/:id/balance", async (req, res) => {
  db.run(`SELECT current_balance from movement where account_id = ?`, [
    req.params.id,
  ]);
  // send confirmation
  res.json({
    message: `account created successfully for customer ${customer_id}`,
  });
});
// transfer amounts bt any 2 accounts
app.post("api/accounts/transfer", async (req, res) => {
  const { from_id, to_id, amount } = req.body;
  db.run(
    `
  INSERT INTO transfers (date, from_id, to_id, amount) VALUES (?, ?, ?, ?)
  `,
    [Date.now(), from_id, to_id, amount]
  );
  const transer_id = db.run(`SELECT last_insert_rowid()`);
  // record in movement table
  db.run(
    `
  INSERT INTO movement (date_of_transfer, account_id, amount, transfer_id) VALUES (?, ?, ?, ?)
  `,
    [Date.now(), from_id, -amount, transfer_id]
  );
  db.run(
    `
  INSERT INTO movement (date_of_transfer, account_id, amount, transfer_id) VALUES (?, ?, ?, ?)
  `,
    [Date.now(), to_id, amount, transfer_id]
  );
  res.send({
    message: "transfer success",
  });
});
// retrieve transfer history for a given account
app.get("api/accounts/:id/transfer", async (req, res) => {
  const { id } = req.params.id;
  // retrieve from DB
  db.run(`SELECT * from movement where account_id = ${id}`);
});
app.use(function (req, res) {
  res.status(404).json({ message: "route not found" });
});
app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
