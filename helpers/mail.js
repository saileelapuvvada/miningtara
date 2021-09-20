var nodemailer = require('nodemailer');
var config = require("../config");
var transporter = nodemailer.createTransport({
  service: config.mail.service,
  auth: config.mail.auth,
});


function sendEmail(subject, body, toMail) {
  const mailOptions = {
    from: config.mail.auth.user,
    to: toMail,
    subject: subject, // Subject line
    html: body
  };
  transporter.sendMail(mailOptions, function (err, info) {
    if (err) {
      console.log('mail sent');
    } else {
      console.log('mail not sent', err);
    }
  });
}
module.exports = {
  sendEmail
};
