const router = require("express").Router();
// import the userControllers
const {
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword,
  updatePassword,
  searchUserByName,
  getAllUsers,
  followUser
} = require("../controller/userController");
const { authGuard } = require("../middleware/authGuard");

router.route("/register").post(registerUser);
router.route("/login").post(loginUser);
router.route("/update/password").put(authGuard, updatePassword);
router.route("/forgot/password").post(forgotPassword);
router.route("/password/reset/:token").put(resetPassword);
router.route("/search").post(authGuard, searchUserByName);
router.route("/follow/:id").get(authGuard, followUser);
// export the router
module.exports = router;
