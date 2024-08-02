import mongoose from "mongoose";
const Schema=mongoose.Schema
const UserSchema=new Schema({
    Email:{
        required:true,
        type:String
    },
    Password:{
        required:true,
        type:String
    }
})
export default mongoose.model('Users',UserSchema)