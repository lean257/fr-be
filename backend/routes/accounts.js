const express = require("express");
const router = express.Router();

// create new bank accounts
router.post("/accounts", async (req, res, next) => {
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
    console.error("error creating new account: " + err.message);
    next(err);
  }
});

// retrieve balance for a given account
router.get("/accounts/:id/balance", async (req, res, next) => {
  db.run(`SELECT current_balance from movement where account_id = ?`, [
    req.params.id,
  ]);
  // send confirmation
  res.json({
    message: `account created successfully for customer ${customer_id}`,
  });
});
// transfer amounts bt any 2 accounts
router.post("/accounts/transfer", async (req, res, next) => {
  try {
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
  } catch (err) {
    next(err);
  }
});
// retrieve transfer history for a given account
router.get("/accounts/:id/transfer", async (req, res) => {
  const { id } = req.params.id;
  // retrieve from DB
  db.run(`SELECT * from movement where account_id = ${id}`);
});
module.exports = router;
