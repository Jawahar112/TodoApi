import mongoose from "mongoose";
import moment from "moment";
import { transporter } from "../configs/nodemailer.js";
import Handlebars from "handlebars";
import fs from "fs/promises";
import TodoModel from "../models/Todos.js";
import { customError } from "../utils/Joi_Schema/CustomError.js";
export const Addtask = async (req, res, next) => {
  const response = {
    status: false,
    statusCode: 500,
    data: {},
    message: "Unprocessable Entity",
  };
  try {
    const { UserId } = req;
    const { Task, Time, Category } = req.body;
    const date = new Date(Time);
    const isAdded = await TodoModel.findOne({
      User: UserId,
      Todos: { $elemMatch: { Time: date } },
    });
    if (isAdded) {
      return res
        .status(200)
        .json({ message: "Task already addded to that time", status: false });
    }
    const currentDate = moment().utc(new Date()).utcOffset("+5:30");

    if (date < currentDate.subtract(1, "minute").seconds(59)) {
      throw new customError.BadRequestError("Time Should not be past");
    }

    // Check if task already exists within 15 minutes
    const isValidTask = await TodoModel.findOne({
      User: UserId,
      Todos: {
        $elemMatch: {
          Time: {
            $gt: date.getTime() - 15 * 60 * 1000,
            $lt: date.getTime(),
          },
        },
      },
    });
    if (isValidTask) {
      return res.status(200).json({
        message: "There is a task already added before  few minutes",
        status: false,
      });
    }

    // Check if user has TodoList
    const todoList = await TodoModel.findOne({ User: UserId });
    if (!todoList) {
      const newTodo = new TodoModel({
        User: UserId,
        Todos: [{ Task, Time: date, Category }],
      });
      const addedtodo = await newTodo.save();
    } else {
      if (!isAdded) {
        await TodoModel.updateOne(
          { User: UserId },
          { $push: { Todos: { Task, Time: date, Category } } }
        );
      }
    }

    response.status = true;
    response.statusCode = 200;
    response.message = "Task added sucessfully";
  } catch (error) {
    response.message = error.message;
  }
  return res.status(response.statusCode).json(response);
};

export const GetAllTasks = async (req, res) => {
  const response={
    status: false,
    statusCode: 500,
    data: {},
    message: "Unprocessable Entity",
  }
  try {
    const UserId = req.UserId;
    const {StartingTime }= req.query;
    const {EndingTime}=req.query;
    //2024-08-07T11:30:00.000+00:00 --format of date
    const date=new Date("2024-08-07")
    const date2=`${date.getFullYear()}-0${date.getMonth()}-0${date.getDay()}T23:59:59.000+00:00`


    // Create a Moment object for the specified date
// Format the date to the desired end-of-day format
// const date = moment("2024-08-07");
// const date2 = date.endOf('day').format("YYYY-MM-DDTHH:mm:ss.SSSZ");
// console.log(new Date(date2));
const Tasks = await TodoModel.aggregate([
      {
        $match: {
          User: mongoose.Types.ObjectId.createFromHexString(UserId),

          "Todos.Time": { $gte: new Date(StartingTime), $lte:new Date( EndingTime) },
        },
      },
      { $unwind: "$Todos" },
      {
        $match: {
          "Todos.Time": { $gte:new Date( StartingTime), $lte: new Date(EndingTime) },
        },
      },
      { $sort: { "Todos.Time": 1 } },
      {
        $group: {
          _id: "$_id",
          User: { $first: "$User" },

          Todos: { $push: "$Todos" },
        }
      }
    ]);
    if (!Tasks||!Tasks.length) {
      return res.status(200).json({
        message: "No tasks added to the todo list",
        status: false,
        data: Tasks,
      });
    }
      response.message= "Data retrieved successfully",
      response.status= true,
      response.data= Tasks,
      response.statusCode=200
    
  } catch (error) {
   response.message=error.message || response.message
  }
  return res.status(response.statusCode).json(response)
};

export const GetFinisedTasks = async (req, res) => {
  const response={
    status: false,
    statusCode: 500,
    data: {},
    message: "Unprocessable Entity",
  }
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
      return res.status(200).json({
        message: "No finished tasks",
        status: false,
        data: Tasks,
        status: false,
      });
    }
   response.statusCode=200
   response.Tasks=Tasks;
   response.message="Data retreived sucessfully";
   response.status=true;
  } catch (error) {
    response.message=error.message || response.message
  }
  return res.status(response.statusCode).json(response)
}

export const GetPendingTasks = async (req, res) => {
  const response={
    status: false,
    statusCode: 500,
    data: {},
    message: "Unprocessable Entity",
  }

  try {
    const UserId = req.UserId;
    const Tasks = await TodoModel.aggregate([
      {
        $match: {
          User: mongoose.Types.ObjectId.createFromHexString(UserId),
          "Todos.Completed": false,
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
      return res.json({
        message: "No pending tasks",
        data: Tasks,
        status: false,
      });
    }
     response.statusCode=200
      response.message="Data retreived sucessfully",
     response.status= true,
      response.Tasks= Tasks
  
   } catch (error) {
    response.message=error.message || response.message
  }
  return res.status(response.statusCode).json(response)
}

export const deleteTask = async (req, res) => {
  const response={
    status: false,
    statusCode: 500,
    data: {},
    message: "Unprocessable Entity",
  }
  try {
    const UserId = req.UserId;
    const { taskId } = req.params;
    const deletedTask = await TodoModel.updateOne(
      { User: mongoose.Types.ObjectId.createFromHexString(UserId) },
      { $pull: { Todos: { _id: taskId } } }
    );
    if (!deletedTask || !deletedTask.modifiedCount) {
      return res.json({ message: "Task Not Found or Server Error" });
    }
    response. message= "Task deleted sucessfully",
    response.status= true,
    response.statusCode=200 
  } catch (error) {
    response.message=error.message || response.message
  }
};

export const EditTask = async (req, res) => {
  const response={
    status: false,
    statusCode: 500,
    data: {},
    message: "Unprocessable Entity",
  }
  try {
    const UserId = req.UserId;

    const { taskId } = req.params;
    const fields = req.query;

    if (!fields || !Object.keys(fields).length) {
     throw new customError.BadRequestError("field_is_required")
    }
    const ToupdateFields = {};
    for (const key in fields) {
      ToupdateFields[`Todos.$.${key}`] = fields[key];
    }

    const UpdatedTask = await TodoModel.updateOne(
      {
        User: mongoose.Types.ObjectId.createFromHexString(UserId),
        "Todos._id": taskId,
      },
      {
        $set: ToupdateFields,
      }
    );

    if (!UpdatedTask.modifiedCount) {
      return res.status(400).json({
        message: "Task not found or Already updated",
        status: false,
      });
    }
   response.status=true
   response.statusCode=200
   response.message="Task deleted sucessfully"
  } catch (error) {
    response.message=error.message || response.message
  }
  return res.status(response.statusCode).json(response)
};
export const FinishTask = async (req, res) => {
  const response={
    status: false,
    statusCode: 500,
    data: {},
    message: "Unprocessable Entity",
  }
  try {
    const UserId = req.UserId;
    const { taskId } = req.params;
    const User = await UserModel.findById({ _id: UserId });
    if (!User) {
      return res.json({ Message: "User Not Found", status: false });
    }
    const ReceiverEmail = User.Email;
    const FinishedTask = await TodoModel.updateOne(
      {
        User: mongoose.Types.ObjectId.createFromHexString(UserId),
        "Todos._id": taskId,
      },
      { $set: { "Todos.$.Completed": true } }
    );
    if (!FinishedTask.modifiedCount) {
      return res
        .status(409)
        .json({ message: "Task Already Finished", status: false });
    }
    const task = await TodoModel.findOne(
      {
        User: mongoose.Types.ObjectId.createFromHexString(UserId),
        "Todos._id": taskId,
      },
      { "Todos.$": 1 }
    );
    const Taskname = task.Todos[0].Task;
    const htmlData = await fs.readFile("./views/EmailTemplate.hbs", "utf-8");
    const template = Handlebars.compile(htmlData);
    const html = template({ Taskname: Taskname });

    const MailOptions = {
      from: "bharathijawahar583@gmail.com",
      to: ReceiverEmail,
      subject: "Task Completed!",
      html: html,
    };

    const SentMail = await transporter.sendMail(MailOptions);

    if (!SentMail) {
      return res.json({ message: "Email sending failed", status: false });
    }

    response.statusCode=200
      response.message= "Task Updated and  confirmation mail sended to user"
      response.status= true
  
  } catch (error) {
    response.message=error.message || response.message
  }
};

export const SearchTask = async (req, res) => {
 
  const response={
    status: false,
    statusCode: 500,
    data: {},
    message: "Unprocessable Entity",
  }
  try {
    const UserId = req.UserId;
    let { From, To } = req.query;
    const StartDate = new Date(From);

    
    const EndDate = new Date(To);
    EndDate.setHours(23)
  console.log(EndDate.getHours);
  
 
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
                ],
              },
            },
          },
        },
      },
    ]);

    if (!Query_result || !Query_result.length) {
      return res.json({
        message: "No tasks found in that time",
        status: false,
      });
    }

    return res.status(200).json({
      message: "Tasks fetched successfully",
      data: Query_result,
      status: true,
    });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return res
      .status(500)
      .json({ error: "Internal Server 500  Error", message: error.message });
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
    );
    if (!Task || Task.Todos.length === 0) {
      return res.json({ message: "Task not Found", status: false });
    }
    return res
      .status(200)
      .json({ message: "Data fetched sucessfully", status: true, data: Task });
  } catch (error) {
    return res
      .status(500)
      .json({ Error: "Internal Server Error", message: error.message });
  }
};
