const express = require("express");
const app = express();
const db = require("./services/db.js");
const port = 8000;
const accountRouter = require("./routes/accounts");
const userRouter = require("./routes/users");
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Please refer to instructions");
});
app.use("/users", userRouter);
app.use("/accounts", accountRouter);
app.use(function (req, res) {
  res.status(404).json({ message: "route not found" });
});
app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
