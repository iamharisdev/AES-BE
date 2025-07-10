export const forgotPasswordTemplate = (user:any,code:string) =>{

  return(
  `<div style="max-width:420px;margin:0 auto;background:#fff;border-radius:10px;box-shadow:0 2px 8px #eee;padding:32px 24px 24px 24px;font-family:sans-serif;">
  <div style="text-align:center;margin-bottom:16px;">
    <img src="cid:awaazesehatlogo" alt="Awaaz-e-Sehat Logo" style="width:120px;margin-bottom:8px;" />
  </div>
  <h2 style="color:#2a7ae2;text-align:center;margin-bottom:8px;">Awaaz-e-Sehat</h2>
  <p style="font-size:16px;color:#333;text-align:center;margin-bottom:24px;">Hello${user.name ? ` <b>${user.name}</b>,` : ''}</p>
  <p style="font-size:16px;color:#333;text-align:center;margin-bottom:8px;">Your One-Time Password (OTP) is:</p>
  <div style="text-align:center;margin:24px 0;">
    <span style="display:inline-block;font-size:32px;letter-spacing:8px;background:#f5f7fa;padding:12px 32px;border-radius:8px;color:#2a7ae2;font-weight:bold;box-shadow:0 1px 4px #eee;">${code}</span>
  </div>
  <p style="font-size:14px;color:#666;text-align:center;margin-bottom:0;">This code will expire in 30 minutes</p>
  <p style="font-size:13px;color:#aaa;text-align:center;margin-top:24px;">If you did not request this code, you can safely ignore this email.</p>
</div>
`
)
}