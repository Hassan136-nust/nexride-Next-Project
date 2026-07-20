import nodemailer from "nodemailer"

export const sendEmail = async ({
  to,
  subject,
  html,
}: {
  to: string
  subject: string
  html: string
}) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL,
      pass: process.env.PASS,
    },
  })

  await transporter.sendMail({
    from: `"NexRide 🚗" <${process.env.EMAIL}>`,
    to,
    subject,
    html,
  })
}