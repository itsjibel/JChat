import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as dotenv from 'dotenv';

dotenv.config();

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
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
      console.log(`Welcome email sent to ${email}`);
      return { success: true, message: 'Welcome email sent successfully' };
    } catch (error) {
      console.error('Error sending welcome email:', error);
      throw new Error('An error occurred while sending the welcome email');
    }
  }
}
