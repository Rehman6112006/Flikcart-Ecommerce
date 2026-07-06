const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { 
    user: process.env.EMAIL_USER, 
    pass: process.env.EMAIL_PASS 
  },
  connectionTimeout: 10000,
  socketTimeout: 10000,
});
transporter.sendMail({
  from: '"FlikCart" <' + process.env.EMAIL_FROM + '>',
  to: 'abdulrehman6112006@gmail.com',
  subject: 'Test from FlikCart',
  html: '<p>Test email</p>'
}).then(r => console.log('SUCCESS:', r.messageId)).catch(e => console.log('ERROR:', e.message));
