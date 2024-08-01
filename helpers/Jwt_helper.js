import jwt from 'jsonwebtoken'
const JWT_KEY=process.env.JWT_KEY
export const GenerateToken=({payload,options})=>{
return new Promise((resolve,reject)=>{

    jwt.sign(payload,JWT_KEY,options,(err,token)=>{
        if(err){

            reject(err)
        }
        
        resolve(token)
    })
   })
 }

 
export const VerifyToken=(token)=>{

    return new Promise((resolve,reject)=>{
        jwt.verify(token,JWT_KEY,(err,decoded)=>{
            if(err){
            
               reject(err);
            }
            resolve(decoded)
        })
    })
    
}