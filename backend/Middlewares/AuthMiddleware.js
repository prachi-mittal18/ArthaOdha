const { UserModel } = require("../model/UserModel");
const jwt = require("jsonwebtoken");

module.exports.userVerification = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ status: false, message: "No token provided, unauthorized access" });
  }
  jwt.verify(token, process.env.TOKEN_KEY, async (err, data) => {
    if (err) {
      return res.status(401).json({ status: false, message: "Invalid or expired token, unauthorized" });
    } else {
      try {
        const user = await UserModel.findById(data.id);
        if (user) {
          req.user = user;
          next();
        } else {
          return res.status(404).json({ status: false, message: "User not found" });
        }
      } catch (error) {
        console.error("Middleware DB error:", error);
        return res.status(500).json({ status: false, message: "Internal server error during authentication" });
      }
    }
  });
};
