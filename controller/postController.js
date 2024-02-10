const Post = require("../model/postModel");
const User = require("../model/userModel");
const cloudinary = require("cloudinary");
const Activity = require("../model/activityModel");

exports.createPost = async (req, res) => {
  try {
    // Check incoming data
    console.log(req.body);
    console.log(req.files);

    // Destructure the data
    const { caption } = req.body;
    const { image } = req.files;

    // Validate data
    if (!caption || !image) {
      return res.status(400).json({
        success: false,
        message: "Please enter caption and provide an image",
      });
    }

    // Upload image to Cloudinary
    const uploadedImage = await cloudinary.v2.uploader.upload(image.path, {
      folder: "posts",
      crop: "scale",
    });

    // Save to the database
    const newPostData = {
      caption,
      image: uploadedImage.secure_url,
      owner: req.user._id,
    };

    const post = await Post.create(newPostData);

    // Response
    res.status(200).json({
      success: true,
      message: "Post created successfully",
      post,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

exports.getPostOfFollowingUsers = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    const posts = await Post.find({
      $or: [
        { owner: { $in: user.following } }, // Posts from users the current user is following
        { owner: req.user._id } // Posts from the current user
      ]
    })
    .sort("-createdAt")
    .populate("owner", "name avatar");

    res.status(200).json({
      success: true,
      message: "Posts of following users",
      posts,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

exports.likeAndUnlikePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    const userIndex = post.likes.indexOf(req.user._id);

    if (userIndex !== -1) {
      // If user has already liked the post, unlike it
      post.likes.splice(userIndex, 1);
      await post.save();

      // Remove activity
      await Activity.deleteOne({
        user: req.user._id,
        actionType: "liked",
        post: post._id,
      });

      return res.status(200).json({
        success: true,
        message: "Post Unliked",
      });
    } else {
      // If user has not liked the post, like it
      post.likes.push(req.user._id);
      await post.save();

      // Create activity
      const likedActivity = await Activity.create({
        user: req.user._id,
        actionType: "liked",
        post: post._id,
      });

      // Find and update the post owner's activity to reflect the like
      const postOwner = await User.findById(post.owner);

      await Activity.updateOne(
        { _id: likedActivity._id },
        { targetUser: postOwner._id }
      );

      return res.status(200).json({
        success: true,
        message: "Post Liked",
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
