import { LoginSchema,RegisterSchema } from "../../../utils/Joi_Schema/UserSchema.js";
export const ValidateLogin=(req,res,next)=>{

 try {
       const {error}=LoginSchema.validate(req.body)
       if(error) return res.json({Message:error.message,status:false})  
           next() 
 } catch (error) {
    return res
    .status(500)
    .json({ Error: "Internal Server Error", message: error.message });
 }
}
export const ValidateRegister=(req,res,next)=>{
    
   try {
     const{error}=RegisterSchema.validate(req.body)
     if(error) return res.json({Message:error.message,status:false})
         next()
   } catch (error) {
    return res
    .status(500)
    .json({ Error: "Internal Server Error", message: error.message });
   }  
}