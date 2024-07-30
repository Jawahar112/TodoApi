import UserModel from "../models/Users.js";
import TodoModel from "../models/Todos.js";
import { GenerateToken } from "../helpers/Jwt_helper.js";
import mongoose from "mongoose";


export const Register = async (req, res) => {
  try {
    const { Email, Password } = req.body;
    if (!Email || !Password) {
      return res
        .status(400)
        .json({
          message: "Email and password should not be empty",
          status: false,
        });
    }
    const user = await UserModel.findOne({ Email: Email });
    if (user) {
      return res.json({ Message: "User Already Exist", status: false });
    }

    const NewUser = new UserModel({ Email, Password });
    await NewUser.save();
    return res.json({
      Message: "User Registration was sucessful",
      status: true,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ Error: "Internal Server Error", message: error.message });
  }
}

export const Login = async (req, res) => {
  try {
    const { Email, Password } = req.body;
    if (!Email || !Password) {
      return res.json({
        Message: "Email and Password is required",
        status: false,
      });
    }
    const user = await UserModel.findOne({ Email: Email });
    if (!user) {
      return res.json({ Message: "User not Found", status: false });
    }
    if (user.Password !== Password) {
      return res.json({ Message: "Invalid Email Or Password", status: false });
    }
    const token = await GenerateToken({ UserId: user._id },{ expiresIn: '1h' })
    return res.json({
      Message: "Token generated sucessfully",
      Token: token,
      status: true,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ Error: "Internal Server 500  Error", message: error.message });
  }
};

export const Addtask = async (req, res) => {
  try {
    const UserId = req.UserId;
    const { Task, Time, Category } = req.body;

    const date = new Date(Time);

    const TodoList = await TodoModel.findOne({ User: UserId });
    const IsAdded = await TodoModel.findOne({
      User: mongoose.Types.ObjectId.createFromHexString(UserId),
      
      Todos: { $elemMatch: { Time: { $eq: date } } },
    });

    if (!TodoList) {
      const newTodo = new TodoModel({
        User: mongoose.Types.ObjectId.createFromHexString(UserId),
        Todos: [{ Task: Task, Time: date, Category: Category }],
      });
      await newTodo.save();
      return res.json({ Message: "task Added sucessfully", status: true });
    } else {
      if (!IsAdded) {
        const updateTodo = await TodoModel.updateOne(
          { User: UserId },
          { $push: { Todos: { Task, Time: date, Category } } }
        );
        if (!updateTodo) {
          throw new Error("Adding task failed");
        }
        return res.json({ Message: "task Added sucessfully", status: true });
      } else {
        return res.json({
          Message: "Task Already added to that time",
          status: false,
        });
      }
    }
  } catch (error) {
    return res
      .status(500)
      .json({ Error: "Internal Server Error", message: error.message });
  }
}



export const GetAllTasks = async (req, res) => {
  try {
    const date = req.query.Date;
    const UserId = req.UserId;
    
    // Validate the input date
    if (!date) {
      return res.status(400).json({
        message: "Date query parameter is required",
        status: false,
      });
    }

    const StartingTime = new Date(date);
    StartingTime.setHours(0, 0, 0, 0);
    const EndingTime = new Date(date);
    EndingTime.setHours(23, 59, 59, 999);

    const Tasks = await TodoModel.aggregate([
      { $match: { 
        User: mongoose.Types.ObjectId.createFromHexString(UserId),
        
      }},
      { $unwind: "$Todos" },
      { $match: {
        "Todos.Time": { $gte: StartingTime, $lte: EndingTime } 
      }},
      { $sort: { "Todos.Time": 1 } },
      {
        $group: {
          _id: "$_id",
          User: { $first: "$User" },
          Todos: { $push: "$Todos" }
        }
      }
    ]);

    if (!Tasks.length) {
      return res.json({
        message: "No tasks added to the todo list",
        status: false,
      });
    }

    return res.json({
      message: "Data retrieved successfully",
      status: true,
      Tasks: Tasks,
    })
  } catch (error) {
    return res.status(500).json({ 
      Error: "Internal Server Error", 
      message: error.message 
    });
  }
}




export const GetFinisedTasks = async (req, res) => {
  try {
    const UserId = req.UserId;
    const Tasks = await TodoModel.aggregate([
      {
        $match: {
          User: mongoose.Types.ObjectId.createFromHexString(UserId),
          "Todos.Completed": true,
        },
      },
      {
        $project: {
          Todos: {
            $filter: {
              input: "$Todos",
              as: "todo",
              cond: { $eq: ["$$todo.Completed", true] },
            },
          },
        },
      },
    ]);

    if (!Tasks || !Tasks.length) {
      return res.json({ message: "No finished tasks", status: false });
    }
    return res.json({
      message: "Data retreived sucessfully",
      status: true,
      Tasks: Tasks,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ Error: "Internal Server Error", message: error.message });
  }
};




export const GetPendingTasks = async (req, res) => {
  try {
    const UserId = req.UserId;
    const Tasks = await TodoModel.aggregate([
      {
        $match: {
          User: mongoose.Types.ObjectId.createFromHexString(UserId),
          "Todos.Completed": true,
        },
      },
      {
        $project: {
          Todos: {
            $filter: {
              input: "$Todos",
              as: "todo",
              cond: { $eq: ["$$todo.Completed", false] },
            },
          },
        },
      },
    ]);
    if (!Tasks || !Tasks.length) {
      return res.json({ message: "No pending tasks" });
    }
    return res.json({
      message: "Data retreived sucessfully",
      status: true,
      Tasks: Tasks,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ Error: "Internal Server Error", message: error.message });
  }
};


export const deleteTask = async (req, res) => {
  try {
    const UserId = req.UserId;
    const { taskId } = req.params;

    const deletedTask = await TodoModel.updateOne(
      { User: mongoose.Types.ObjectId.createFromHexString(UserId) },
      { $pull: { Todos: { _id: taskId } } }
    );
    if (!deleteTask || !deletedTask.modifiedCount) {
      return res.json({ message: "Task Not Found or Server Error" });
    }
    return res.json({ Message: "Task deleted sucessfully", status: true });
  } catch (error) {
    return res
      .status(500)
      .json({ Error: "Internal Server Error", message: error.message });
  }
}



export const EditTask = async (req, res) => {
 try {
   const UserId = req.UserId;
 
   const { taskId } = req.params;
   const fields = req.query;
  
   if (!fields || !Object.keys(fields).length) {
     return res.json({
       message: "Atleast one field is required",
       status: false,
     });
   }
   const ToupdateFields = {};
     for (const key in fields) {
     ToupdateFields[`Todos.$.${key}`] = fields[key];
   }
 
   const UpdatedTask = await TodoModel.updateOne(
     {
       User: mongoose.Types.ObjectId.createFromHexString(UserId),
       "Todos._id": taskId
     },
     {
       $set: ToupdateFields
     }
   );
 
   if (!UpdatedTask.modifiedCount) {
     return res.json({
       message: "Task not found or Already updated",
       status: false
     });
   }
   return res.json({ message: "Task updated sucessfully", status: true });
 } catch (error) {
  return res
      .status(500)
      .json({ Error: "Internal Server 500  Error", message: error.message });
 }
};




export const FinishTask = async (req, res) => {
 try {
   const UserId = req.UserId;
   const { taskId } = req.params;
   const FinishedTask = await TodoModel.updateOne(
     {
       User: mongoose.Types.ObjectId.createFromHexString(UserId),
       "Todos._id": taskId,
     },
     { $set: { "Todos.$.Completed": true } }
   );
 
   if (!FinishedTask.modifiedCount) {
     return res.json({ message: "Task or user not found", status: false });
   }
   return res
     .status(200)
     .json({ message: "Task Updated Sucessfully", status: true });
 } catch (error) {
  return res
      .status(500)
      .json({ Error: "Internal Server 500  Error", message: error.message });
 }
};




export const SearchTask = async (req, res) => {
  try {
    const UserId = req.UserId;
    let { From, To } = req.query;
    const StartDate = new Date(From);

    const EndDate = new Date(To);
    EndDate.setHours(23);
    EndDate.setMinutes(59);
    EndDate.setSeconds(59);
    EndDate.setMilliseconds(999);

    const Query_result = await TodoModel.aggregate([
      {
        $match: {
          User: mongoose.Types.ObjectId.createFromHexString(UserId),
          "Todos.Time": { $gte: StartDate, $lte: EndDate },
        },
      },
      {
        $project: {
          Todos: {
            $filter: {
              input: "$Todos",
              as: "todo",
              cond: {
                $and: [
                  { $gte: ["$$todo.Time", StartDate] },
                  { $lte: ["$$todo.Time", EndDate] },
                ]
              }
            }
          }
        }
      }
    ]);

    if (!Query_result || !Query_result.length ) {
      return res.json({
        message: "No tasks found in that time",
        status: false,
      });
    }

    return res.status(200).json({
      message: "Tasks fetched successfully",
      tasks: Query_result,
      status: true,
    });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return res
      .status(500)
      .json({ Error: "Internal Server 500  Error", message: error.message });
  }
};


export const getTask = async (req, res) => {         
 try {
   const UserId = req.UserId;

   const { taskId } = req.params;
 
   const Task = await TodoModel.findOne(
     {
       User: mongoose.Types.ObjectId.createFromHexString(UserId),
       "Todos._id": taskId,
     },
     { Todos: 1 }
   )
   if (!Task) {
     return res.json({ message: "Task not found", status: false });
   }
   return res
     .status(200)
     .json({ message: "Data fetched sucessfully", status: true, Task: Task });
 } catch (error) {
  return res
      .status(500)
      .json({ Error: "Internal Server Error", message: error.message });
 }
}
