import nodemailer from 'nodemailer';
// Nodemailer transporter (configure as needed)
export const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user:   process.env.SMTP_USER,
    pass:   process.env.SMTP_PASS,
  },
});