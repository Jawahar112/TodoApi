import UserModel from "../models/Users.js";
import { GenerateToken } from "../helpers/Jwt_helper.js";
import { customError } from "../utils/Joi_Schema/CustomError.js"
export const Register = async (req, res) => {

  const response = {
    status: false,
    statusCode: 500,
    data: {},
    message: "Unprocessable Entity",
  };
  try {
    const { Email, Password } = req.body;
    if (!Email || !Password) {
    
       throw new customError.BadRequestError("Email and password is required")
       
    }
    const user = await UserModel.findOne({ Email: Email });
    if (user) {
      response.message="User already Exist",
      response.status=false
      response.statusCode=200
    }

    const NewUser = new UserModel({ Email, Password });
    await NewUser.save();
    response.message = "User Registration was sucessful";
    response.statusCode = 200;
    response.status = false;

  } catch (error) {
    error.message=error.message || response.message,
    error.status=false
    error.statusCode=500
}
 return res.status(response.statusCode).json(response)
};

export const Login = async (req, res) => {
  const response = {
    status: false,
    statusCode: 500,
    data: {},
    message: "Unprocessable Entity",
  }
  try {
    const { Email, Password } = req.body;
    if (!Email || !Password) {
      throw new customError.BadRequestError("Email and password is required")
    }
    const user = await UserModel.findOne({ Email: Email });
    if (!user) {
     throw new customError.NotFoundError("User Not found")
    }
    if (user.Password !== Password) {
      throw new customError.BadRequestError("password doesnt match")
    }
    const token = await GenerateToken({
      options: { expiresIn: "5h" },
      payload: { UserId: user._id },
    });
 response.message="Login sucesfull"
 response.status=true
 response.statusCode=200
 response.token=token
  } catch (error) {
    console.log(error);
     response.message=error.message || response.message,
    response.status=false
    response.statusCode=500
  }
  return res.status(response.statusCode).json(response)
}
