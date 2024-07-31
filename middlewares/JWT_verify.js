import { VerifyToken } from "../helpers/Jwt_helper.js";
export const VerifyUser=async(req,res,next)=>{
    try {
        const Token=req.headers.authorization
        const User=await VerifyToken(Token)
        if(!Token){
            return res.status(400).json({Message:"Token Must Be Provided",status:false})
        }
        req.UserId=User.UserId
       
        next()
    } catch (error) {
        return res
        .status(500)
        .json({ Error: "Internal Server Error", message: error.message });
    }
}
