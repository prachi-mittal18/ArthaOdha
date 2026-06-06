const { Signup, Login, Logout } = require("../Controllers/AuthController");
const { userVerification } = require("../Middlewares/AuthMiddleware");
const router = require("express").Router();

router.post("/signup", Signup);
router.post("/login", Login);
router.post("/verify", userVerification, (req, res) => {
  res.status(200).json({ status: true, user: req.user.username, email: req.user.email });
});
router.post("/logout", Logout);

module.exports = router;
