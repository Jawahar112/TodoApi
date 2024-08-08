import joi from 'joi'
export const LoginSchema=joi.object({           
    Email:joi.string().email().required(),
    Password:joi.string().min(6).required(),

})
export const RegisterSchema=joi.object({
    Email:joi.string().email().required(),
    Password:joi.string().min(6).required(),
    
})
