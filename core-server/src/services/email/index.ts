import { forgotPasswordTemplate } from "./templates/forgotPassword"
import { transporter } from "./transport"

const sendEmail = async (email:string, user:any, code:string) => {
  let emailSent = true
  try {
    await transporter.sendMail({
      from: '"Awaaz-e-Sehat" <no-reply@awaazesehat.com>',
      to: email,
      subject: 'Your OTP Code',
      html:forgotPasswordTemplate(user, code),
      attachments: [
        {
          filename: 'awaazesehat.png',
          path: 'src/image/awaazesehat.png',
          cid: 'awaazesehatlogo'
        }
      ]
    })
    emailSent = true
  } catch (error) {
    console.log(error,"ERRRR")
    emailSent = false
  }
 return emailSent

}

export{ sendEmail}