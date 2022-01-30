const sql_create_customers = `
    CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone TEXT,
        email TEXT,
        date_became_customer TEXT,
        login TEXT,
        password TEXT,
        customer_type TEXT)`;
const sql_create_accounts = `
    CREATE TABLE IF NOT EXISTS accounts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id INTEGER,
        date_opened TEXT,
        date_closed TEXT,
        account_type TEXT,
        initial_balance INTEGER,
        currency_id TEXT,
        balance INTEGER,
        FOREIGN KEY (customer_id)
        REFERENCES customers (id)
            ON UPDATE CASCADE
            ON DELETE CASCADE
        FOREIGN KEY (balance)
        REFERENCES transactions (current_balance)
            ON UPDATE CASCADE
            ON DELETE CASCADE
        )`;
const sql_create_transfer = `
    CREATE TABLE IF NOT EXISTS transfers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT NOT NULL,
            from_id INTEGER REFERENCES accounts (id),
            to_id INTEGER REFERENCES accounts (id),
            amount INTEGER
            )`;
const sql_create_movement = `
    CREATE TABLE IF NOT EXISTS movement (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date_of_transfer TEXT NOT NULL,
        account_id INTEGER REFERENCES accounts (id),
        transfer_id INTEGER REFERENCES transfers (id),
        amount INTEGER,
        current_balance INTEGER,
        transaction_type_code TEXT
        )`;

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
module.exports = {
  sql_create_accounts,
  sql_create_customers,
  sql_create_transfer,
  sql_create_movement,
  trigger1,
  trigger2,
  trigger3,
  trigger4,
};
