const router = require("express").Router();
const {createPost, getPostOfFollowingUsers, likeAndUnlikePost, } = require("../controller/postController");
const {authGuard} = require("../middleware/authGuard");
router.route("/post/upload").post(authGuard,createPost);
router.route("/posts").get(authGuard, getPostOfFollowingUsers);
router.route("/post/:id").get(authGuard, likeAndUnlikePost);
module.exports = router;
