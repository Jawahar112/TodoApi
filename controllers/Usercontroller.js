import UserModel from "../models/Users.js";
import TodoModel from "../models/Todos.js";
import { GenerateToken } from "../helpers/Jwt_helper.js";
import mongoose from "mongoose";
import moment from "moment";
import { transporter } from "../configs/nodemailer.js";
export const Register = async (req, res) => {
  try {
    const { Email, Password } = req.body;
    if (!Email || !Password) {
      return res.status(400).json({
        message: "Email and password should not be empty",
        status: false,
      });
    }
    const user = await UserModel.findOne({ Email: Email });
    if (user) {
      return res.json({ message: "User Already Exist", status: false });
    }

    const NewUser = new UserModel({ Email, Password });
    await NewUser.save();
    return res.status(200).json({
      Message: "User Registration was sucessful",
      status: true,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ Error: "Internal Server Error", message: error.message });
  }
};

export const Login = async (req, res) => {
  try {
    const { Email, Password } = req.body;
    if (!Email || !Password) {
      return res.status(400).json({
        message: "Email and Password is required",
        status: false,
      });
    }
    const user = await UserModel.findOne({ Email: Email });
    if (!user) {
      return res.json({ message: "User not Found", status: false });
    }
    if (user.Password !== Password) {
      return res
        .status(400)
        .json({ message: "Invalid Email Or Password", status: false });
    }
    const token = await GenerateToken({
      options: { expiresIn: "5h" },
      payload: { UserId: user._id },
    });
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
    const { UserId } = req;
    const { Task, Time, Category } = req.body;

    const date = new Date(Time);
    const currentDate = moment().utcOffset("+5:30");

    // Check if date is valid
    if (date < currentDate) {
      return res.status(400).json({ message: "Date should be valid", status: false });
    }

    // Check if task already exists within 15 minutes
    const isValidTask = await TodoModel.findOne({
      User: UserId,
      Todos: {
        $elemMatch: {
          Time: {
            $gt: new Date(date.getTime() - 15 * 60 * 1000),
            $lt: new Date(date.getTime() + 15 * 60 * 1000)
          }
        }
      }
    })

    if (isValidTask) {
      return res
        .status(400)
        .json({
          message: "There is a task already added before or after few minutes",
          status: false,
        })
    }

    // Check if user has TodoList
    const todoList = await TodoModel.findOne({ User: UserId });

    if (!todoList) {
      const newTodo = new TodoModel({
        User: UserId,
        Todos: [{ Task, Time: date, Category }],
      });
      await newTodo.save();
    } else {
      const isAdded = await TodoModel.findOne({
        User: UserId,
        Todos: { $elemMatch: { Time: date } },
      });

      if (!isAdded) {
        await TodoModel.updateOne({ User: UserId }, { $push: { Todos: { Task, Time: date, Category } } });
      } else {
        return res.status(400).json({
          message: "Task Already added to that time",
          status: false
        })
      }
    }

    return res.status(200).json({ message: "Task Added successfully", status: true });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Internal Server Error", message: error.message });
  }
}

export const GetAllTasks = async (req, res) => {
  try {
    const date = req.query.date;
    const UserId = req.UserId;

    // Validate the input date
    if (!date) {
      return res.status(400).json({
        message: "Date query parameter is required",
        status: false
      })
    }

    const StartingTime = new Date(date);
    StartingTime.setHours(0, 0, 0, 0);
    const EndingTime = new Date(date);
    EndingTime.setHours(23, 59, 59, 999);

    const Tasks = await TodoModel.aggregate([
      {
        $match: {
          User: mongoose.Types.ObjectId.createFromHexString(UserId),
        
           
            "Todos.Time": { $gte: StartingTime, $lte: EndingTime }
          
        }
      },
      { $unwind: "$Todos" },
    
     
      { $sort: { "Todos.Time": 1 } },
      {
        $group: {
          _id: "$_id",
          User: { $first: "$User" },

          Todos: { $push: "$Todos" },
        },
      },
    ]);

    if (!Tasks.length) {
      return res.json({
        message: "No tasks added to the todo list",
        status: false,
      });
    }

    return res.status(200).json({
      message: "Data retrieved successfully",
      status: true,
      tasks: Tasks,
    });
  } catch (error) {
    return res.status(500).json({
      error: "Internal Server Error",
      message: error.message,
    });
  }
};

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
    return res.status(200).json({
      message: "Data retreived sucessfully",
      status: true,
      tasks: Tasks,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ error: "Internal Server Error", message: error.message });
  }
};

export const GetPendingTasks = async (req, res) => {
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
      return res.json({ message: "No pending tasks" });
    }
    return res.status(200).json({
      message: "Data retreived sucessfully",
      status: true,
      tasks: Tasks,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ error: "Internal Server Error", message: error.message });
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
    return res
      .status(200)
      .json({ message: "Task deleted sucessfully", status: true });
  } catch (error) {
    return res
      .status(500)
      .json({ error: "Internal Server Error", message: error.message });
  }
};

export const EditTask = async (req, res) => {
  try {
    const UserId = req.UserId;

    const { taskId } = req.params;
    const fields = req.query;

    if (!fields || !Object.keys(fields).length) {
      return res.status(400).json({
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
    return res.json({ message: "Task updated sucessfully", status: true });
  } catch (error) {
    return res
      .status(500)
      .json({ error: "Internal Server 500  Error", message: error.message });
  }
};

export const FinishTask = async (req, res) => {
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
      return res.json({ message: "Task Already Finished", status: false });
    }
    const task = await TodoModel.findOne(
      {
        User: mongoose.Types.ObjectId.createFromHexString(UserId),
        "Todos._id": taskId,
      },
      { "Todos.$": 1 }
    );

    const Taskname = task.Todos[0].Task;
    const MailOptions = {
      from: "bharathijawahar583@gmail.com",
      to: ReceiverEmail,
      subject: " Task Completed!",
      html: `
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 0;
              background-color: #f9f9f9;
            }
            .container {
              width: 100%;
              max-width: 600px;
              margin: 0 auto;
              background: #ffffff;
              border: 1px solid #dddddd;
              border-radius: 8px;
              overflow: hidden;
            }
            .header {
              background: #007bff;
              color: #ffffff;
              padding: 20px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
            }
            .content {
              padding: 20px;
            }
            .content h2 {
              font-size: 20px;
              color: #333333;
            }
            .content p {
              font-size: 16px;
              color: #666666;
              line-height: 1.5;
            }
            .footer {
              background: #f1f1f1;
              color: #888888;
              padding: 10px;
              text-align: center;
              font-size: 14px;
            }
            .button {
              display: inline-block;
              padding: 10px 20px;
              font-size: 16px;
              color: #ffffff;
              background: #007bff;
              text-decoration: none;
              border-radius: 4px;
            }
            .button:hover {
              background: #0056b3;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Task Completed!</h1>
            </div>
            <div class="content">
              <h2>Congratulations!</h2>
              <p>You have successfully completed the task: <strong>${Taskname}</strong>.</p>
              <p>Great job on finishing this task! Keep up the excellent work.</p>
             
            </div>
            <div class="footer">
             
              <p>If you have any questions, please contact support at <a href="mailto:support@example.com">support@example.com</a>.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    };

    const SentMail = await transporter.sendMail(MailOptions);

    if (!SentMail) {
      return res.json({ message: "Email sending failed", status: false });
    }

    return res
      .status(200)
      .json({
        message: "Task Updated and  confirmation mail sended to user",
        status: true,
      });
  } catch (error) {
    return res
      .status(500)
      .json({ error: "Internal Server 500  Error", message: error.message });
  }
};

export const SearchTask = async (req, res) => {
  try {
    const UserId = req.UserId;
    let { From, To } = req.query;
    const StartDate = new Date(From);
    const EndDate = new Date(To);
    EndDate.setHours(23, 59, 29, 999);

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
      tasks: Query_result,
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
      .json({ message: "Data fetched sucessfully", status: true, task: Task });
  } catch (error) {
    return res
      .status(500)
      .json({ Error: "Internal Server Error", message: error.message });
  }
};
