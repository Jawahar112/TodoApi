import express from "express";
import { Addtask,deleteTask,EditTask,FinishTask,GetAllTasks,GetFinisedTasks, GetPendingTasks, getTask, SearchTask} from "../controllers/Taskcontroller.js";
 const Router=express.Router()
import { VerifyUser } from "../middlewares/JWT_verify.js";
 import { Login,Register } from "../controllers/Usercontroller.js"
 import { ValidateLogin,ValidateRegister } from "../middlewares/Validations/Joi/Uservalidations.js";
Router.route('/register').post(ValidateRegister,Register)
Router.route('/login').post(ValidateLogin,Login)
Router.route('/tasks').post(VerifyUser,Addtask).get(VerifyUser,GetAllTasks)
Router.route('/completedTasks').get(VerifyUser,GetFinisedTasks)
Router.route('/pendingTasks').get(VerifyUser,GetPendingTasks)
Router.route('/delete/:taskId').delete(VerifyUser,deleteTask)
Router.route('/edit/:taskId').put(VerifyUser,EditTask)
Router.route('/finish/:taskId').put(VerifyUser,FinishTask)
Router.route('/search').get(VerifyUser,SearchTask)
Router.route('/task/:taskId').get(VerifyUser,getTask)
export default Router