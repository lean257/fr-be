const express = require("express");
const router = express.Router();
const db = require("../services/db");

// create new bank accounts
router.post("/", async (req, res, next) => {
  try {
    // grab user, initial deposit amount from the body
    let { customer_id, deposit } = req.body;

    // update accounts table
    // TODO: should check if customer_id exists? Or if not exists, assume not customer of the bank
    db.run(
      `INSERT INTO accounts (date_opened, customer_id, initial_balance, balance) VALUES
        (${Date.now()}, ${customer_id}, ${deposit}, ${deposit})
        `,
      function (err) {
        if (err) {
          console.log(err);
          next(err);
        }
        // send confirmation
        res.send({
          customer: customer_id,
          initial_balance: deposit,
          balance: deposit,
          id: this.lastID,
        });
      }
    );
  } catch (err) {
    console.error("error creating new account: " + err.message);
    next(err);
  }
});

// retrieve balance for a given account
router.get("/:id/balance", async (req, res, next) => {
  db.get(
    `SELECT balance from accounts where id = ?`,
    [req.params.id],
    function (err, result) {
      if (err) {
        next(err);
      } else {
        res.send({ balance: result.balance });
      }
    }
  );
});

// transfer amounts bt any 2 accounts
router.post("/transfer", async (req, res, next) => {
  try {
    const { from_id, to_id, amount } = req.body;
    // check if the account id exists, if not create the accounts
    db.get(`select * from accounts where id=${from_id}`, (err, row) => {
      if (row === undefined) {
        db.run(`
        INSERT INTO accounts (id, intial_balance) VALUES (${from_id}, 0)
        `);
      }
    });
    db.get(`select * from accounts where id=${to_id}`, (err, row) => {
      if (row === undefined) {
        db.run(`
        INSERT INTO accounts (id, intial_balance) VALUES (${to_id}, 0)
        `);
      }
    });
    db.run(
      `
    INSERT INTO transfers (date, from_id, to_id, amount) VALUES (?, ?, ?, ?)
    `,
      [Date.now(), from_id, to_id, amount],
      function (err) {
        if (err) {
          console.log(err);
        } else {
          let transfer_id = this.lastID;
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
            transfer_id: transfer_id,
            from_id: from_id,
            to_id: to_id,
            amount: amount,
          });
        }
      }
    );
  } catch (err) {
    next(err);
  }
});

// retrieve transfer history for a given account
router.get("/:id/transfer-history", async (req, res, next) => {
  try {
    const { id } = req.params;
    // retrieve from movement table to get all transfer transactions
    db.all(
      `SELECT * from movement where account_id = ?`,
      [id],
      function (err, row) {
        res.json({
          message: "retrieved transfer history",
          result: row,
        });
      }
    );
  } catch (err) {
    next(err);
  }
});
module.exports = router;
