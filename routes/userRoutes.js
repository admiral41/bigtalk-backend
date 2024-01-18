const router = require("express").Router();
// import the userControllers
const {
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword,
  updatePassword,
  searchUserByName
} = require("../controller/userController");
const { authGuard } = require("../middleware/authGuard");

router.route("/register").post(registerUser);
router.route("/login").post(loginUser);
router.route("/update/password").put(authGuard, updatePassword);
router.route("/forgot/password").post(forgotPassword);
router.route("/password/reset/:token").put(resetPassword);
router.route("/search").post(authGuard, searchUserByName);
// export the router
module.exports = router;
