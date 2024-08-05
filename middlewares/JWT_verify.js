import { VerifyToken } from "../helpers/Jwt_helper.js";
export const VerifyUser = async (req, res, next) => {
  try {
    const Token = req.headers.authorization || req.headers.authorization;
    if (!Token) {
      return res
        .status(400)
        .json({ message: "Token Must Be Provided", status: false });
    }
    const User = await VerifyToken(Token);

    req.UserId = User.UserId;

    next();
  } catch (error) {
    return res
      .status(400)
      .json({ error: "Token Error", message: error.message });
  }
};
