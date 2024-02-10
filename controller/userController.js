const { sendEmail } = require("../middleware/sendMail");
const User = require("../model/userModel");
const crypto = require("crypto");
const Activity = require("../model/activityModel");

const registerUser = async (req, res) => {
  try {
    console.log(req.body);
    const { name, email, password,username } = req.body;

    //Step 3 : validate the incoming data
    if (!name || !email || !password || !username) {
      return res.json({
        success: false,
        message: "Please enter all fields.",
      });
    }
    let user = await User.findOne({ email });
    if (user) {
      return res.json({ success: false, message: "User already exists" });
    }
    user = await User.create({
      name,
      email,
      password,
      username,
      avatar: { public_id: "sample_id", url: "sample_url" },
    });
    //use this to direct login after register
    const token = await user.generateToken();
    const options = {
      expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      httpOnly: true,
    };
    res.status(200).cookie("token", token, options).json({
      success: true,
      message: "User created successfully",
      user,
      token,
    });
    // user this if sidhai register hune bittikei login na hunna : res.status(201).json({ success: true, user });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
const loginUser = async (req, res) => {
  console.log(req.body);
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.json({
        success: false,
        message: "User does not exist",
      });
    }
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.json({
        success: false,
        message: "Incorrect password",
      });
    }
    const token = await user.generateToken();
    const options = {
      expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      httpOnly: true,
    };
    res.status(200).cookie("token", token, options).json({
      message: "Login successful",
      success: true,
      user,
      token,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
const updatePassword = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("+password");

    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Please provide old and new password",
      });
    }

    const isMatch = await user.matchPassword(oldPassword);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Incorrect Old password",
      });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password Updated",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
const forgotPassword = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    
    if (!user) {
      return res.json({
        success: false,
        message: "Email not found.",
      });
    }
    const resetPasswordToken = user.getResetPasswordToken();

    await user.save();

    // Assuming you have a configuration variable for the frontend URL
    const frontendBaseUrl = process.env.FRONTEND_BASE_URL || "http://localhost:3000";
    const resetUrl = `${frontendBaseUrl}/password/reset/${resetPasswordToken}`;

    const message = `Reset Your Password by clicking on the link below: \n\n ${resetUrl}`;

    try {
      await sendEmail({
        email: user.email,
        subject: "Reset Password",
        message,
      });

      res.status(200).json({
        success: true,
        message: `Email sent to ${user.email}`,
      });
    } catch (error) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();

      res.json({
        success: false,
        message: error.message,
      });
    }
  } catch (error) {
    console.log(error);
    res.json({
      success: false,
      message: error.message,
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Token is invalid or has expired",
      });
    }

    user.password = req.body.password;

    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password Updated",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
const searchUserByName = async (req, res) => {
  try {
    const { name } = req.body;
    const users = await User.find({
      name: { $regex: name, $options: "i" },
    }).select("-password");
    res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
}
};
const followUser = async (req, res) => {
  try {
    const userToFollow = await User.findById(req.params.id);
    const loggedInUser = await User.findById(req.user._id);

    if (!userToFollow) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if the user is trying to follow themselves
    if (loggedInUser._id.equals(userToFollow._id)) {
      return res.status(400).json({
        success: false,
        message: "You cannot follow yourself",
      });
    }

    if (loggedInUser.following.includes(userToFollow._id)) {
      // If already following, unfollow
      const indexFollowing = loggedInUser.following.indexOf(userToFollow._id);
      const indexFollowers = userToFollow.followers.indexOf(loggedInUser._id);

      loggedInUser.following.splice(indexFollowing, 1);
      userToFollow.followers.splice(indexFollowers, 1);

      await loggedInUser.save();
      await userToFollow.save();

      // Remove activity from the target user's activities
      await Activity.deleteOne({
        user: userToFollow._id, // Changed this line to targetUser
        actionType: "follow",
        targetUser: req.user._id, // Changed this line to the user who initiated the action
      });

      res.status(200).json({
        success: true,
        message: "User Unfollowed",
      });
    } else {
      // If not following, follow
      loggedInUser.following.push(userToFollow._id);
      userToFollow.followers.push(loggedInUser._id);

      await loggedInUser.save();
      await userToFollow.save();

      // Create activity for the target user
      await Activity.create({
        user: userToFollow._id, // Changed this line to targetUser
        actionType: "following",
        targetUser: req.user._id, // Changed this line to the user who initiated the action
      });

      res.status(200).json({
        success: true,
        message: "User followed",
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  updatePassword,
  forgotPassword,
  resetPassword,
  searchUserByName,
  followUser
};
