const Activity = require("../model/activityModel");

const getActivities = async (req, res) => {
    try {
      let activities;
      if (req.params.tab === 'all') {
        activities = await Activity.find({ user: req.user._id })
          .sort("-createdAt")
          .populate({
            path: "user",
            select: "name", // Adjust the fields you want to select
          })
          .populate({
            path: "targetUser",
            select: "name", // Adjust the fields you want to select
          })
          .populate("post", "caption");
      } else {
        // If you have a specific condition for "follow" activity, update it accordingly
        activities = await Activity.find({
          user: req.user._id,
          actionType: "following", // or whatever condition identifies follow activity
        })
          .sort("-createdAt")
          .populate({
            path: "user",
            select: "name", // Adjust the fields you want to select
          })
          .populate({
            path: "targetUser",
            select: "name", // Adjust the fields you want to select
          });
      }
      res.status(200).json({
        success: true,
        activities,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };
  
module.exports = {
  getActivities,
};
