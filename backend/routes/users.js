const express = require("express");
const router = express.Router();
const users = require("../services/users");

// get user by id
router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    res.json({
      message: `successfully retreived user ${id}`,
      data: users.getUserById(id),
    });
  } catch (err) {
    console.error("error retrieving user " + err.message);
    next(err);
  }
});
module.exports = router;
