import { betterAuth } from "better-auth";
import { emailAndPassword } from "better-auth/providers";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { db } from "./db";
import nodemailer from "nodemailer";

// 1. Configure Nodemailer to use your Gmail account
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Test the connection when the server starts
transporter.verify(function (error, success) {
  if (error) {
    console.error("Nodemailer configuration error:", error);
  } else {
    console.log("Server is ready to send emails. Configuration is correct!");
  }
});

export const auth = betterAuth({
  adapter: prismaAdapter(db),
  providers: [
    emailAndPassword(),
  ],
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          console.log(`\n[Auth Hook] New user created! Attempting to send email to: ${user.email}`);
          if (!user.email) return;
          try {
            const info = await transporter.sendMail({
              from: `"CampusRoute" <${process.env.EMAIL_USER}>`,
              to: user.email,
              subject: "Welcome to CampusRoute!",
              text: `Welcome to CampusRoute, ${user.name || 'User'}!\n\nWe're letting you know that this email address was just used to create an account. If you made this request, you're all set! Enjoy tracking your buses.\n\nIf you did not sign up, you can safely ignore this email.`,
              html: `
                <div style="font-family: sans-serif; padding: 20px; color: #333;">
                  <h2 style="color: #1d4ed8;">Welcome, ${user.name || 'User'}!</h2>
                  <p>We're letting you know that this email address was just used to create an account on <strong>CampusRoute</strong>.</p>
                  <p>If you made this request, you're all set! Enjoy tracking your buses.</p>
                  <p style="margin-top: 30px; font-size: 12px; color: #666;">If you did not sign up for CampusRoute, you can safely ignore this email.</p>
                </div>
              `,
            });
            console.log(`Welcome email successfully sent to ${user.email} (Message ID: ${info.messageId})\n`);
          } catch (error) {
            console.error("Failed to send notification email:", error);
          }
        }
      }
    }
  }
});

export type Auth = typeof auth;