const { Signup, Login } = require("../Controllers/AuthController");
const { userVerification } = require("../Middlewares/AuthMiddleware");
const router = require("express").Router();

router.post("/signup", Signup);
router.post("/login", Login);
router.post("/verify", userVerification, (req, res) => {
  res.status(200).json({ status: true, user: req.user.username, balance: req.user.balance });
});
router.post("/logout", (req, res) => {
  res.clearCookie("token", {
    httpOnly: true, // Should match the security level of the set cookie
    sameSite: "lax",
    // For localhost, secure flag can be false
    secure: false,
  });
  res.status(200).json({ status: true, message: "Logged out" });
});

module.exports = router;
