const Post = require("../model/postModel");
const User = require("../model/userModel");
const cloudinary = require("cloudinary");
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
