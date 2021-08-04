import nodemailer from "nodemailer";

// Send email to user for password reset using NodeMailer

export async function sendEmail(to: string, html: string) {
  // create reusable transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: "kwdnrgqu6mz3h7jl@ethereal.email", // generated ethereal user
      pass: "PrfvYGX7sHJtXUFKh2", // generated ethereal password
    },
  });

  // send mail with defined transport object
  let info = await transporter.sendMail({
    from: '"noreply-reddit-clone-by-Quan" <noreply@reddit-clone.com>', // sender address
    to: to, // list of receivers
    subject: "Change Your Password Request", // Subject line

    html: html, //html body for the mail
  });

  console.log("Message sent: %s", info.messageId);
  // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

  // Preview only available when sending through an Ethereal account
  console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
  // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
}
