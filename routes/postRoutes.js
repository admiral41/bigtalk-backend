const router = require("express").Router();
const {createPost} = require("../controller/postController");
const {authGuard} = require("../middleware/authGuard");
router.route("/post/upload").post(authGuard,createPost);
module.exports = router;
