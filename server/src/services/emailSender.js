import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

function createTransport() {
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) {
    return null;
  }

  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT || 587,
    secure: !!env.SMTP_SECURE,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS
    }
  });
}

const transport = createTransport();

export async function sendEmail({ to, subject, text, html, from } = {}) {
  if (!transport) {
    throw new Error('SMTP not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS in server/.env');
  }

  const mailOptions = {
    from: from || env.EMAIL_FROM || 'no-reply@nxtbiz.local',
    to,
    subject,
    text,
    html
  };

  const info = await transport.sendMail(mailOptions);
  return info;
}
