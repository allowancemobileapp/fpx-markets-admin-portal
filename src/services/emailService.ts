
// src/services/emailService.ts
'use server';

interface EmailOptions {
  to: string;
  subject: string;
  body: string; // Can be HTML or plain text
}

/**
 * Mock email sending function. In a real application, this would integrate
 * with an email service provider (e.g., SendGrid, AWS SES, Resend).
 */
export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
  console.log("========== MOCK EMAIL START ==========");
  console.log(`To: ${options.to}`);
  console.log(`Subject: ${options.subject}`);
  console.log(`Body:\n${options.body}`);
  console.log("========== MOCK EMAIL END ==========");

  if (!options.to || !options.subject || !options.body) {
    console.error("MOCK EMAIL SERVICE: Missing 'to', 'subject', or 'body'.");
    return { success: false, error: "Missing required email fields (to, subject, or body)." };
  }

  // Simulate a successful email send
  return { success: true, messageId: `mock-email-${crypto.randomUUID()}` };
}
