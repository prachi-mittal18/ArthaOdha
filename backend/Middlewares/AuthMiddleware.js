const jwt = require("jsonwebtoken");
const { UserModel } = require("../model/UserModel");

/**
 * Middleware to verify the JWT token stored in an httpOnly cookie.
 */
module.exports.userVerification = (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    console.warn(`[${new Date().toISOString()}] Auth Warning: No token cookie found in request to ${req.path}`);
    return res.status(401).json({ status: false, message: "No token provided" });
  }

  jwt.verify(token, process.env.TOKEN_KEY, async (err, data) => {
    if (err) {
      return res.status(401).json({ status: false, message: "Invalid token" });
    }

    try {
      const user = await UserModel.findById(data.id);
      if (user) {
        // Attach the user object to the request for use in other routes
        req.user = {
          id: user._id,
          username: user.username,
          email: user.email,
          balance: user.balance
        };
        next();
      } else {
        return res.status(401).json({ status: false, message: "User not found" });
      }
    } catch (error) {
      console.error("Auth Middleware Error:", error);
      return res.status(500).json({ status: false, message: "Internal server error" });
    }
  });
};