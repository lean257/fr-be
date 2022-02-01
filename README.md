# farmraise

NodeJS server for banking admin tool. Server is deployed [here](https://fr-be.herokuapp.com/).

API Routes include:

- POST /api/accounts, request body: {customer_id: 1, deposit: 100}

  - Create a new bank account for a customer, with an initial deposit amount. A single customer may have multiple bank accounts.

- POST /api/accounts/transfer, request body: {from_id: 1, to_id: 4, amount: 100}

  - Transfer amounts between any two accounts, including those owned by different customers.

- GET /api/accounts/:id/balance

  - Retrieve balances for a given account.

- GET /api/accounts/:id/transfer-history
  - Retrieve transfer history for a given account.
