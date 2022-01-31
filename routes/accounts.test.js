const { app, server } = require("../server");
const request = require("supertest");
const db = require("../services/db");
const { expect } = require("@jest/globals");

beforeAll((done) => {
  done();
});

afterAll((done) => {
  // Closing the DB connection allows Jest to exit successfully.
  server.close();
  done();
});
describe("endpoint that allows creating a new bank account", () => {
  it("creates initial balance and balance when account is created", async () => {
    const res = await request(app).post("/api/accounts/").send({
      customer_id: 1,
      deposit: 100,
    });
    expect(res.body.initial_balance).toBe(100);
    db.all(
      `select * from accounts where customer_id = 1`,
      function (err, rows) {
        expect(rows[rows.length - 1].initial_balance).toEqual(100);
      }
    );
  });
});

describe("endpoint that allows transfer amounts between 2 accounts", () => {
  it("records the transfer in transfer table and movement table and updates balance for the account_id", async () => {
    // get account_id and balance
    const result = await request(app).post("/api/accounts/").send({
      customer_id: 12,
      deposit: 100,
    });
    let { id: account_id, balance: current_balance } = result.body;

    // perform the transfer and get transfer_id
    let res = await request(app)
      .post("/api/accounts/transfer")
      .send({
        from_id: account_id,
        to_id: 3,
        amount: 10,
      })
      .expect(200);
    let { transfer_id: last_row_id, amount: transfer_amount } = res.body;

    // check DB for changes in transfer and movement table
    db.get(
      `select * from transfers where from_id = ${account_id}`,
      function (err, row) {
        expect(row.amount).toBe(10);
        db.all(
          `select * from movement where transfer_id = ${last_row_id}`,
          function (err, rows) {
            expect(rows[0].account_id).toBe(account_id);
            expect(rows[0].amount).toBe(-10);
          }
        );
      }
    );
    // check for updated balance from accounts table
    db.get(
      `select * from accounts where id=${account_id}`,
      function (err, row) {
        expect(row.balance).not.toEqual(current_balance);
        expect(row.balance).toEqual(current_balance - transfer_amount);
      }
    );
  });
});

describe("endpoint that allows retrieving balance", () => {
  it("returns the correct balance", async () => {
    let res = await request(app).post("/api/accounts/").send({
      customer_id: 14,
      deposit: 1000,
    });
    let { id: account_id, balance: current_balance } = res.body;
    // do a transfer
    let transfer = await request(app)
      .post("/api/accounts/transfer")
      .send({
        from_id: account_id,
        to_id: 5,
        amount: 80,
      })
      .expect(200);
    let { amount: transfer_amount } = transfer.body;
    let result = await request(app).get(`/api/accounts/${account_id}/balance`);
    expect(result.body.balance).toEqual(current_balance - transfer_amount);
  });
});
