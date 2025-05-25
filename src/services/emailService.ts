
// src/services/emailService.ts
'use server';

import { Resend } from 'resend';

interface EmailOptions {
  to: string;
  subject: string;
  body: string; // HTML content for the email
}

let resend: Resend | null = null;
const RESEND_FROM_EMAIL = 'fpxmarkets@gmail.com'; // Your specified "from" email

function getResendClient(): Resend {
  if (!resend) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error("RESEND_API_KEY environment variable is not set.");
      throw new Error("Email service is not configured: Missing RESEND_API_KEY.");
    }
    resend = new Resend(apiKey);
  }
  return resend;
}

/**
 * Sends an email using the Resend API.
 */
export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!options.to || !options.subject || !options.body) {
    const errorMessage = "Missing required email fields (to, subject, or body).";
    console.error(`EmailService Error: ${errorMessage}`);
    return { success: false, error: errorMessage };
  }

  if (!process.env.RESEND_API_KEY) {
    // Fallback to console logging if API key is missing, to prevent crashes during development
    // if .env.local is not set up, but log a clear warning.
    console.warn("---------------------------------------------------------------------");
    console.warn("WARNING: RESEND_API_KEY is not set. Email will be logged to console.");
    console.warn("To send actual emails, set RESEND_API_KEY in your .env.local file.");
    console.warn("---------------------------------------------------------------------");
    console.log("========== MOCK EMAIL (RESEND NOT CONFIGURED) START ==========");
    console.log(`To: ${options.to}`);
    console.log(`From: ${RESEND_FROM_EMAIL}`);
    console.log(`Subject: ${options.subject}`);
    console.log(`Body (HTML):\n${options.body}`);
    console.log("========== MOCK EMAIL (RESEND NOT CONFIGURED) END ==========");
    return { success: true, messageId: `mock-console-email-${Date.now()}` };
  }
  
  try {
    const client = getResendClient();
    const data = await client.emails.send({
      from: RESEND_FROM_EMAIL,
      to: options.to,
      subject: options.subject,
      html: options.body, // Resend expects HTML content in the 'html' field
    });

    if (data.error) {
      console.error('Resend API Error:', data.error);
      return { success: false, error: data.error.message || 'Failed to send email via Resend.' };
    }

    console.log(`Email sent successfully to ${options.to} via Resend. Message ID: ${data.data?.id}`);
    return { success: true, messageId: data.data?.id };

  } catch (error: any) {
    console.error('Error sending email via Resend:', error);
    return { success: false, error: error.message || 'An unexpected error occurred while sending email.' };
  }
}
