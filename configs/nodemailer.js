import nodemailer from 'nodemailer'
import 'dotenv/config'

export const transporter=nodemailer.createTransport({
    
    host:process.env.SMTP_HOST,
    port:587,
    
    auth:{
          user:process.env.SMTP_USER,
          pass:process.env.SMTP_PASSWORD,
       
    }
})