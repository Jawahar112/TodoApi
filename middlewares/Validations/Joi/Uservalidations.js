
import { LoginSchema,RegisterSchema } from "../../../utils/Joi_Schema/UserSchema.js";
export const ValidateLogin=(req,res,next)=>{

    const {error}=LoginSchema.validate(req.body)
    if(error) return res.json({Message:error.message,status:false})  
        next() 
}
export const ValidateRegister=(req,res,next)=>{
    
    const{error}=RegisterSchema.validate(req.body)
    if(error) return res.json({Message:"Email and Password is required",Error:error})
        next()  
}