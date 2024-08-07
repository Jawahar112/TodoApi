import express from "express"
import 'dotenv/config'
import { connectDB } from "./configs/Mongodbconfig.js"
import  Router  from "./Routes/userRouter.js"
const app=express()

/* middlewares  */



app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.set('view engine','handlebars')
app.use('/api/',Router)
app.use('*', function(req, res){

    res.status(404).json({message:'Page Not Found 404'});
  });
 

  app.disable('x-powered-by');
const PORT=process.env.PORT || 3000;
connectDB()
app.listen(PORT,(err)=>{
    if(err)console.log(err);
    console.log(`Server Running On Server http://localhost:${PORT} or http://127.0.0.1:${PORT}`);
})
