const express = require("express");
const router = express.Router();
const { authGuard } = require("../middleware/authGuard");
const { getActivities } = require("../controller/activityController");

router.get("/activities", authGuard,getActivities); // Add this line

module.exports = router;
