import { Resend } from 'resend';

const FROM_EMAIL = 'One Wonder Lake <contact@onewonderlake.com>';
const MONTHLY_LIMIT = 3000;
const AUTO_SHUTOFF_THRESHOLD = 2500;

function getResendApiKey(): string {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('RESEND_API_KEY environment variable is not set');
  }
  return apiKey;
}

export function getResendClient(): Resend {
  return new Resend(getResendApiKey());
}

export async function sendEmail(to: string, subject: string, htmlBody: string, textBody?: string) {
  const client = getResendClient();
  
  const result = await client.emails.send({
    from: FROM_EMAIL,
    to: [to],
    subject: subject,
    html: htmlBody,
    text: textBody || htmlBody.replace(/<[^>]*>/g, ''),
  });

  return result;
}

export async function getEmailContent(emailId: string) {
  const apiKey = getResendApiKey();
  
  const response = await fetch(`https://api.resend.com/emails/${emailId}`, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch email content: ${response.statusText}`);
  }
  
  return response.json();
}

export function getEmailLimits() {
  return {
    monthlyLimit: MONTHLY_LIMIT,
    autoShutoffThreshold: AUTO_SHUTOFF_THRESHOLD,
  };
}
