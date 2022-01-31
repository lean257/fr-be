const express = require("express");
const app = express();
const port = process.env.PORT || 8000;
const accountRouter = require("./routes/accounts");
const userRouter = require("./routes/users");
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Welcome to my node server");
});
app.use("/api/users", userRouter);
app.use("/api/accounts", accountRouter);
app.use(function (req, res) {
  res.status(404).json({ message: "route not found" });
});
const server = app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
module.exports = { app, server };
