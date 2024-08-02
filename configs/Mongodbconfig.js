import mongoose from 'mongoose'
export const connectDB = async () => {
  try {
    const mongodbcoonnection=await mongoose.connect(process.env.MONGODB_URL);
    if(!mongodbcoonnection){
      throw new Error({Error:"error in mongodb conncetion"})
    }
    console.log("MongoDB Connected sucessfully");
  } catch (err) {
    console.error(err.message);
  }
}
