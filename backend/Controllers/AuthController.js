const { UserModel } = require("../model/UserModel");
const { createSecretToken } = require("../util/SecretToken");
const bcrypt = require("bcryptjs");

module.exports.Signup = async (req, res, next) => {
  try {
    const { email, password, username, createdAt } = req.body;
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists", success: false });
    }
    const user = await UserModel.create({ 
      email, 
      password, // The UserSchema pre-save hook will handle hashing
      username, 
      createdAt,
      balance: 100000 // Starting balance for new users
    });
    const token = createSecretToken(user._id);
    res.cookie("token", token, {
        httpOnly: true,
        sameSite: "lax",
        secure: false,
      });
    // Remove sensitive data before sending
    const userResponse = user.toObject();
    delete userResponse.password;
    return res
      .status(201)
      .json({ message: "User signed in successfully", success: true, user: userResponse, token });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Signup Error:`, error.message);
    return res.status(500).json({ message: "Internal Server Error", success: false });
  }
};

module.exports.Login = async (req, res, next) => {
    try {
      const { email, password } = req.body;
      if(!email || !password ){
        return res.status(400).json({message:'All fields are required', success: false})
      }
      const user = await UserModel.findOne({ email });
      if(!user){
        return res.status(401).json({message:'Email not found / incorrect email', success: false })
      }
      const auth = await bcrypt.compare(password,user.password)
      if (!auth) {
        return res.status(401).json({message:'Incorrect password', success: false })
      }
       const token = createSecretToken(user._id);
       
       if (!token) {
         console.error(`[${new Date().toISOString()}] Login Error: TOKEN_KEY is likely missing or incorrect in .env`);
         return res.status(500).json({ message: "Authentication setup error", success: false });
       }

       res.cookie("token", token, {
        httpOnly: true,
        sameSite: "lax",
        secure: false,
      });
       return res.status(200).json({ 
         message: "User logged in successfully", 
         success: true,
         token // Return token so frontend can save to localStorage
       });
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Login Error:`, error.message);
      return res.status(500).json({ message: "Internal Server Error", success: false });
    }
  }
