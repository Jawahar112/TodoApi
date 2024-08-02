import mongoose from "mongoose";
const Schema = mongoose.Schema;
const Todo_schema = new Schema({

  Task: {
    required: true,
    type: String,
  },
  Time: {
    required: true,
    type: Date,
  },
  Category: {
    type: String,
    enum: ["Fitness", "Grocery", "Work", "Personal", "Other"],
    required: true,
  },
  Completed: {
    type: Boolean,
    default: false,
    
  },
  softdel:{
    type:Boolean
  }
});
const Todos_schema = new Schema({
  User: {
    type: Schema.Types.ObjectId,
    ref: "Users",
    required: true,
  },
  Todos: [Todo_schema],
});
export default mongoose.model("Todos", Todos_schema);
