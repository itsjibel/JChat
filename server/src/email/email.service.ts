import { Injectable, Inject } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as dotenv from 'dotenv';
import { Connection } from 'mysql2/promise';
import { randomBytes } from 'crypto';

dotenv.config();

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(
    @Inject('MYSQL_CONNECTION') private readonly connection: Connection,
  ) {
    this.transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com', // Use the correct SMTP server for Gmail
      port: 465, // The default port for secure SMTP
      secure: true, // Use SSL/TLS
      auth: {
        user: process.env.JCHAT_EMAIL_ADDR,
        pass: process.env.JCHAT_APP_PASS,
      },
    });
  }

  async sendWelcomeEmail(username: string, email: string) {
    const mailOptions = {
      from: process.env.JCHAT_EMAIL_ADDR,
      to: email,
      subject: 'Welcome to the JChat community',
      html:
        `<body style="height: 100%; margin: 0; padding: 0; display: flex;">
            <div style="width: 450px; height: 600px; background: linear-gradient(to bottom left, #78e5e5, #3dc6cb, #169a95); margin: auto; text-align: center; border-radius: 10px; padding: 20px; font-family: sans-serif;">
                <a href="https://imageupload.io/6Nq3FH5HcSYhRcF"><img src="https://imageupload.io/ib/QDbvQI5KsU7QLr8_1695304766.png"alt="JChat-Logo.png"style="height:60px;width:auto;"></a>
                    <h1>Hello ` +
        username +
        `</h1>
                <h2>You signed up for the JChat successfully!</h2>
                <h3>A warm welcome to you from the JChat team.</h3>
                <h4>Thank you,<br/>The JChat Team</h4>
            </div>
        </body>`,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`Email sent to '${email}'`);
      return { success: true };
    } catch (error) {
      console.error('Error sending email:', error);
      throw new Error('An error occurred while sending the email');
    }
  }

  async emailVerification(username: string, email: string) {
    const sql = 'SELECT user_id FROM Users WHERE email = ? AND username = ?';
    const checkValues = [email, username];

    try {
      const [result] = await this.connection.execute(sql, checkValues);

      if (result.length === 0) {
        return {
          success: false,
          message: 'This email is not for your user or does not exist',
        };
      }

      const token = randomBytes(64).toString('hex');

      const mailOptions = {
        from: process.env.JCHAT_EMAIL_ADDR,
        to: email,
        subject: 'Please verify your JChat account email address',
        html:
          `<body style="height: 100%; margin: 0; padding: 0; display: flex;">
          <div style="width: 450px; height: 600px; background: linear-gradient(to bottom left, #78e5e5, #3dc6cb, #169a95); margin: auto; text-align: center; border-radius: 10px; padding: 20px; font-family: sans-serif;">
            <img src="public/assets/images/JChat-Logo.png" alt="" style="height: 60px; width: auto;">
            <h2>Hello ` +
          username +
          `, please verify your JChat account email address.</h2>
            <h5 style="color: rgb(242, 242, 242);">When you verify your email, you can change your password</h5>
            <div style="background-color: #006aff; border-radius: 5px; height: 50px; width: 160px; margin: auto; display: flex;">
              <a href="https://jchat.com/auth/verifyUserEmail?token=` +
          token +
          '&username=' +
          username +
          `"style="color:white;text-decoration:none;font-size:20px;margin:auto;font-weight:bold;">Verify</a>
            </div>
            <h4>Thank you,<br/>The JChat Team</h4>
          </div>
        </body>`,
      };

      const updateSql =
        'UPDATE Users SET verify_email_token = ? WHERE BINARY username = ?';
      const updateValues = [token, username];

      await this.connection.execute(updateSql, updateValues);
      await this.transporter.sendMail(mailOptions);

      console.log(`Email sent to '${email}'`);
      return { success: true };
    } catch (error) {
      console.error('An error occurred:', error);
      throw new Error('An error occurred while sending the email');
    }
  }
}
