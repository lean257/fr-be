const express = require("express");
const router = express.Router();
const db = require("../services/db");

// get user by id
router.get("/:id", async (req, res, next) => {
  var sql = "select * from customers where id = ?";
  var params = [req.params.id];
  db.get(sql, params, (err, row) => {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.json({
      message: "success",
      data: row,
    });
  });
});
module.exports = router;
