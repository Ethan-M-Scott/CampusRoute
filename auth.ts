import { betterAuth } from "better-auth";
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
  }
});

export const auth = betterAuth({
  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production",
    database: {
      generateId: false,
    },
  },
  trustedOrigins: async (request) => {
    const origins = new Set<string>([
      process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
      "https://*.vercel.app",
      "http://localhost:3000",
      "http://127.0.0.1:3000",
    ]);

    if (request) {
      try {
        origins.add(new URL(request.url).origin);
      } catch {
        // Ignore malformed request URLs and fall back to the configured origins.
      }
    }

    return Array.from(origins);
  },
  user: {
    additionalFields: {
      school: {
        type: "string",
        required: false,
      },
    },
  },
  cookies: {
    sessionToken: {
      attributes: {
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      },
    },
    sessionData: {
      attributes: {
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  database: prismaAdapter(db, {
    provider: "mongodb", 
  }),
  emailAndPassword: {
    enabled: true,
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          if (!user.email) return;
          try {
            const info = await transporter.sendMail({
              from: `"My Campus Route" <${process.env.EMAIL_USER}>`,
              to: user.email,
              subject: "Welcome to My Campus Route!",
              text: `Welcome to My Campus Route, ${user.name || 'User'}!\n\nWe're letting you know that this email address was just used to create an account on My Campus Route. Enjoy tracking your buses and planning your trips with us.\n\nThank you for joining My Campus Route!`,
              html: `
                <div style="font-family: sans-serif; padding: 20px; color: #333;">
                  <h2 style="color: #1d4ed8;">Welcome, ${user.name || 'User'}!</h2>
                  <p>We're letting you know that this email address was just used to create an account on <strong>My Campus Route</strong>.</p>
                  <p>If you made this request, you're all set! Enjoy tracking your buses.</p>
                  <p style="margin-top: 20px;">Thank you for joining My Campus Route!</p>
                </div>
              `,
            });
          } catch (error) {
            console.error("Failed to send notification email:", error);
          }
        }
      }
    }
  }
});

export type Auth = typeof auth;