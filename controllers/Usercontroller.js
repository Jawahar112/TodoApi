import UserModel from "../models/Users.js";
import { GenerateToken } from "../helpers/Jwt_helper.js";
export const Register = async (req, res) => {
  try {
    const { Email, Password } = req.body;
    if (!Email || !Password) {
      return res.status(400).json({
        message: "Email and password should not be empty",
        status: false,
      });
    }
    const user = await UserModel.findOne({ Email: Email });
    if (user) {
      return res.json({ message: "User Already Exist", status: false });
    }

    const NewUser = new UserModel({ Email, Password });
    await NewUser.save();
    return res.status(200).json({
      Message: "User Registration was sucessful",
      status: true,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ Error: "Internal Server Error", message: error.message });
  }
};

export const Login = async (req, res) => {
  try {
    const { Email, Password } = req.body;
    if (!Email || !Password) {
      return res.status(400).json({
        message: "Email and Password is required",
        status: false,
      });
    }
    const user = await UserModel.findOne({ Email: Email });
    if (!user) {
      return res.json({ message: "User not Found", status: false });
    }
    if (user.Password !== Password) {
      return res
        .status(400)
        .json({ message: "Invalid Email Or Password", status: false });
    }
    const token = await GenerateToken({
      options: { expiresIn: "5h" },
      payload: { UserId: user._id },
    });
    return res.json({
      Message: "Token generated sucessfully",
      Token: token,
      status: true,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ Error: "Internal Server 500  Error", message: error.message });
  }
};



