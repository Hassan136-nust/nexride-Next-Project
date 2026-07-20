import nodemailer from "nodemailer"

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASS,
  },
})

export async function sendOtpEmail(to: string, otp: string) {
  await transporter.sendMail({
    from: `"NexRide" <${process.env.EMAIL}>`,
    to,
    subject: "Your NexRide verification code",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;border:1px solid #e5e7eb;border-radius:16px">
        <h1 style="font-size:24px;font-weight:800;letter-spacing:4px;margin-bottom:4px">NexRide</h1>
        <p style="color:#6b7280;font-size:13px;margin-top:0">Premium Vehicle Booking</p>

        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/>

        <p style="font-size:15px;color:#111">Use the code below to verify your account. It expires in <strong>10 minutes</strong>.</p>

        <div style="margin:32px 0;text-align:center">
          <span style="display:inline-block;font-size:36px;font-weight:800;letter-spacing:12px;color:#111;background:#f3f4f6;padding:16px 32px;border-radius:12px">
            ${otp}
          </span>
        </div>

        <p style="font-size:13px;color:#9ca3af">If you did not create a NexRide account, you can safely ignore this email.</p>
      </div>
    `,
  })
}
