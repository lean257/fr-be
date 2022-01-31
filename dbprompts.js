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
        customer_id INTEGER REFERENCES customers (id),
        date_opened TEXT,
        date_closed TEXT,
        initial_balance INTEGER,
        balance INTEGER
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
        amount INTEGER
        )`;
// trigger to update balance in accounts
// after every insert in movement
const trigger_update_balance = `
create trigger IF NOT EXISTS new_balance after insert on movement
begin
update accounts set balance = balance + new.amount
where id = new.account_id;
end;
`;

module.exports = {
  sql_create_accounts,
  sql_create_customers,
  sql_create_transfer,
  sql_create_movement,
  trigger_update_balance,
};
