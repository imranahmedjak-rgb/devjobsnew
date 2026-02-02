import { Resend } from 'resend';

const FROM_EMAIL = "applications@devglobaljobs.com";

let resend: Resend | null = null;

function getResendClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY not configured - emails will be logged but not sent");
    return null;
  }
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

export interface JobApplicationEmailData {
  recruiterEmail: string;
  recruiterName?: string;
  jobTitle: string;
  companyName: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhone?: string;
  candidateCurrentTitle?: string;
  candidateYearsExperience?: number;
  candidateSummary?: string;
  candidateSkills?: string[];
  candidateLinkedin?: string;
  candidatePortfolio?: string;
  coverLetter?: string;
}

export async function sendJobApplicationEmail(data: JobApplicationEmailData): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const client = getResendClient();
  
  const emailHtml = generateApplicationEmailHtml(data);
  const emailText = generateApplicationEmailText(data);
  
  // Show candidate's name in From field (e.g., "John Doe via Dev Global Jobs")
  const fromName = `${data.candidateName} via Dev Global Jobs`;
  
  if (!client) {
    console.log("=== EMAIL WOULD BE SENT (Resend not configured) ===");
    console.log("To:", data.recruiterEmail);
    console.log("From:", `${fromName} <${FROM_EMAIL}>`);
    console.log("Reply-To:", data.candidateEmail);
    console.log("Subject:", `Application: ${data.candidateName} for ${data.jobTitle}`);
    console.log("Body preview:", emailText.substring(0, 500));
    console.log("=================================================");
    return { success: true, messageId: "mock-" + Date.now() };
  }
  
  try {
    const result = await client.emails.send({
      from: `${fromName} <${FROM_EMAIL}>`,
      to: data.recruiterEmail,
      subject: `Application: ${data.candidateName} for ${data.jobTitle}`,
      html: emailHtml,
      text: emailText,
      replyTo: data.candidateEmail,
    });
    
    if (result.error) {
      console.error("Resend error:", result.error);
      return { success: false, error: result.error.message };
    }
    
    return { success: true, messageId: result.data?.id };
  } catch (error: any) {
    console.error("Email send error:", error);
    return { success: false, error: error.message };
  }
}

function generateApplicationEmailHtml(data: JobApplicationEmailData): string {
  const skillsHtml = data.candidateSkills?.length 
    ? `<p><strong>Key Skills:</strong> ${data.candidateSkills.join(", ")}</p>` 
    : "";
  
  const linksHtml = [];
  if (data.candidateLinkedin) {
    linksHtml.push(`<a href="${data.candidateLinkedin}" style="color: #2563eb;">LinkedIn Profile</a>`);
  }
  if (data.candidatePortfolio) {
    linksHtml.push(`<a href="${data.candidatePortfolio}" style="color: #2563eb;">Portfolio</a>`);
  }
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Job Application from ${data.candidateName}</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0;">via Dev Global Jobs</p>
  </div>
  
  <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
    <p style="color: #6b7280; margin-bottom: 20px;">Dear ${data.recruiterName || "Hiring Manager"},</p>
    
    <p>I am writing to express my interest in your position. Please find my details below.</p>
    
    <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb; margin: 20px 0;">
      <h2 style="color: #1f2937; margin: 0 0 15px; font-size: 18px; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">Position Applied For</h2>
      <p style="margin: 5px 0;"><strong>Job Title:</strong> ${data.jobTitle}</p>
      <p style="margin: 5px 0;"><strong>Company:</strong> ${data.companyName}</p>
    </div>
    
    <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb; margin: 20px 0;">
      <h2 style="color: #1f2937; margin: 0 0 15px; font-size: 18px; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">My Contact Information</h2>
      <p style="margin: 5px 0;"><strong>Name:</strong> ${data.candidateName}</p>
      <p style="margin: 5px 0;"><strong>Email:</strong> <a href="mailto:${data.candidateEmail}" style="color: #2563eb;">${data.candidateEmail}</a></p>
      ${data.candidatePhone ? `<p style="margin: 5px 0;"><strong>Phone:</strong> ${data.candidatePhone}</p>` : ""}
      ${data.candidateCurrentTitle ? `<p style="margin: 5px 0;"><strong>Current Role:</strong> ${data.candidateCurrentTitle}</p>` : ""}
      ${data.candidateYearsExperience ? `<p style="margin: 5px 0;"><strong>Years of Experience:</strong> ${data.candidateYearsExperience}</p>` : ""}
      ${skillsHtml}
    </div>
    
    ${data.candidateSummary ? `
    <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb; margin: 20px 0;">
      <h2 style="color: #1f2937; margin: 0 0 15px; font-size: 18px; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">Professional Summary</h2>
      <p style="margin: 0; color: #4b5563;">${data.candidateSummary}</p>
    </div>
    ` : ""}
    
    ${data.coverLetter ? `
    <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb; margin: 20px 0;">
      <h2 style="color: #1f2937; margin: 0 0 15px; font-size: 18px; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">Cover Letter</h2>
      <p style="margin: 0; color: #4b5563; white-space: pre-line;">${data.coverLetter}</p>
    </div>
    ` : ""}
    
    ${linksHtml.length > 0 ? `
    <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb; margin: 20px 0;">
      <h2 style="color: #1f2937; margin: 0 0 15px; font-size: 18px; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">Documents & Links</h2>
      <p>${linksHtml.join(" | ")}</p>
    </div>
    ` : ""}
    
    <div style="background: #eff6ff; padding: 15px; border-radius: 8px; margin-top: 20px; border-left: 4px solid #2563eb;">
      <p style="margin: 0; color: #1e40af; font-size: 14px;">
        <strong>Reply to this email</strong> to contact me directly at ${data.candidateEmail}
      </p>
    </div>
    
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
    
    <p style="color: #6b7280; font-size: 12px; text-align: center; margin: 0;">
      This application was sent via <a href="https://devglobaljobs.com" style="color: #2563eb;">Dev Global Jobs</a>
    </p>
  </div>
</body>
</html>
  `.trim();
}

function generateApplicationEmailText(data: JobApplicationEmailData): string {
  let text = `
Job Application from ${data.candidateName}
======================================

Dear ${data.recruiterName || "Hiring Manager"},

I am writing to express my interest in your position. Please find my details below.

POSITION APPLIED FOR
--------------------
Job Title: ${data.jobTitle}
Company: ${data.companyName}

MY CONTACT INFORMATION
----------------------
Name: ${data.candidateName}
Email: ${data.candidateEmail}
`;

  if (data.candidatePhone) {
    text += `Phone: ${data.candidatePhone}\n`;
  }
  if (data.candidateCurrentTitle) {
    text += `Current Role: ${data.candidateCurrentTitle}\n`;
  }
  if (data.candidateYearsExperience) {
    text += `Years of Experience: ${data.candidateYearsExperience}\n`;
  }
  if (data.candidateSkills?.length) {
    text += `Key Skills: ${data.candidateSkills.join(", ")}\n`;
  }

  if (data.candidateSummary) {
    text += `
PROFESSIONAL SUMMARY
--------------------
${data.candidateSummary}
`;
  }

  if (data.coverLetter) {
    text += `
COVER LETTER
------------
${data.coverLetter}
`;
  }

  const links = [];
  if (data.candidateLinkedin) links.push(`LinkedIn: ${data.candidateLinkedin}`);
  if (data.candidatePortfolio) links.push(`Portfolio: ${data.candidatePortfolio}`);

  if (links.length > 0) {
    text += `
DOCUMENTS & LINKS
-----------------
${links.join("\n")}
`;
  }

  text += `
--------------------------------------
Please reply to this email to contact me directly.
This application was sent via Dev Global Jobs (devglobaljobs.com)
`;

  return text.trim();
}

// Email verification code sending
export async function sendVerificationCodeEmail(email: string, code: string, firstName?: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const client = getResendClient();
  
  const name = firstName || "there";
  const emailHtml = generateVerificationEmailHtml(code, name);
  const emailText = generateVerificationEmailText(code, name);
  
  if (!client) {
    console.log("=== VERIFICATION EMAIL WOULD BE SENT (Resend not configured) ===");
    console.log("To:", email);
    console.log("From:", `Dev Global Jobs <${FROM_EMAIL}>`);
    console.log("Subject:", `Your verification code: ${code}`);
    console.log("Code:", code);
    console.log("=================================================================");
    return { success: true, messageId: "mock-verification-" + Date.now() };
  }
  
  try {
    const result = await client.emails.send({
      from: `Dev Global Jobs <${FROM_EMAIL}>`,
      to: email,
      subject: `Your verification code: ${code}`,
      html: emailHtml,
      text: emailText,
    });
    
    if (result.error) {
      console.error("Resend verification error:", result.error);
      return { success: false, error: result.error.message };
    }
    
    return { success: true, messageId: result.data?.id };
  } catch (error: any) {
    console.error("Verification email send error:", error);
    return { success: false, error: error.message };
  }
}

function generateVerificationEmailHtml(code: string, name: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Verify Your Email</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0;">Dev Global Jobs</p>
  </div>
  
  <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
    <p style="color: #4b5563; margin-bottom: 20px;">Hi ${name},</p>
    
    <p>Thank you for registering with Dev Global Jobs. Please use the verification code below to complete your registration:</p>
    
    <div style="background: white; padding: 30px; border-radius: 8px; border: 1px solid #e5e7eb; margin: 25px 0; text-align: center;">
      <p style="font-size: 36px; font-weight: bold; color: #1d4ed8; letter-spacing: 8px; margin: 0;">${code}</p>
    </div>
    
    <p style="color: #6b7280; font-size: 14px;">This code will expire in 15 minutes.</p>
    
    <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin-top: 20px; border-left: 4px solid #f59e0b;">
      <p style="margin: 0; color: #92400e; font-size: 14px;">
        <strong>Security tip:</strong> Never share this code with anyone. Dev Global Jobs will never ask for your verification code.
      </p>
    </div>
    
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
    
    <p style="color: #6b7280; font-size: 12px; text-align: center; margin: 0;">
      This email was sent by <a href="https://devglobaljobs.com" style="color: #2563eb;">Dev Global Jobs</a>
    </p>
  </div>
</body>
</html>
  `.trim();
}

function generateVerificationEmailText(code: string, name: string): string {
  return `
Verify Your Email - Dev Global Jobs
====================================

Hi ${name},

Thank you for registering with Dev Global Jobs. Please use the verification code below to complete your registration:

Your verification code: ${code}

This code will expire in 15 minutes.

Security tip: Never share this code with anyone. Dev Global Jobs will never ask for your verification code.

--------------------------------------
This email was sent by Dev Global Jobs (devglobaljobs.com)
  `.trim();
}
