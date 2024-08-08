import { VerifyToken } from "../helpers/Jwt_helper.js";
import { customError } from "../utils/Joi_Schema/CustomError.js";
export const VerifyUser = async (req, res, next) => {
  const response = {
    status: false,
    statusCode: 500,
    data: {},
    message: "Unprocessable Entity",
  }
  try {
    const Token = req.headers.authorization || req.headers.authorization;
    if (!Token) {
     throw new customError.BadRequestError("Token is required")
    }
    const User = await VerifyToken(Token);

    req.UserId = User.UserId;

    next();
  } catch (error) {
    response.message=error.message||response.message,
    response.statusCode=error.statusCode||response.statusCode
    return res.status(response.statusCode).json(response)
  }
 
};
