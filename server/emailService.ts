import { Resend } from 'resend';

const FROM_EMAIL = "applications@devglobaljobs.com";
const FROM_NAME = "Dev Global Jobs";

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
  cvUrl?: string;
  coverLetter?: string;
}

export async function sendJobApplicationEmail(data: JobApplicationEmailData): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const client = getResendClient();
  
  const emailHtml = generateApplicationEmailHtml(data);
  const emailText = generateApplicationEmailText(data);
  
  if (!client) {
    console.log("=== EMAIL WOULD BE SENT (Resend not configured) ===");
    console.log("To:", data.recruiterEmail);
    console.log("From:", `${FROM_NAME} <${FROM_EMAIL}>`);
    console.log("Subject:", `New Application: ${data.candidateName} for ${data.jobTitle}`);
    console.log("Body preview:", emailText.substring(0, 500));
    console.log("=================================================");
    return { success: true, messageId: "mock-" + Date.now() };
  }
  
  try {
    const result = await client.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: data.recruiterEmail,
      subject: `New Application: ${data.candidateName} for ${data.jobTitle}`,
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
  if (data.cvUrl) {
    linksHtml.push(`<a href="${data.cvUrl}" style="color: #2563eb;">Download CV</a>`);
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
    <h1 style="color: white; margin: 0; font-size: 24px;">Dev Global Jobs</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0;">New Job Application</p>
  </div>
  
  <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
    <p style="color: #6b7280; margin-bottom: 20px;">Dear ${data.recruiterName || "Hiring Manager"},</p>
    
    <p>A candidate has applied for your position through Dev Global Jobs.</p>
    
    <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb; margin: 20px 0;">
      <h2 style="color: #1f2937; margin: 0 0 15px; font-size: 18px; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">Position Applied For</h2>
      <p style="margin: 5px 0;"><strong>Job Title:</strong> ${data.jobTitle}</p>
      <p style="margin: 5px 0;"><strong>Company:</strong> ${data.companyName}</p>
    </div>
    
    <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb; margin: 20px 0;">
      <h2 style="color: #1f2937; margin: 0 0 15px; font-size: 18px; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">Candidate Information</h2>
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
        <strong>Reply directly to this email</strong> to contact the candidate at ${data.candidateEmail}
      </p>
    </div>
    
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
    
    <p style="color: #6b7280; font-size: 12px; text-align: center; margin: 0;">
      This application was submitted via <a href="https://devglobaljobs.com" style="color: #2563eb;">Dev Global Jobs</a><br>
      A service by Trend Nova World Ltd.
    </p>
  </div>
</body>
</html>
  `.trim();
}

function generateApplicationEmailText(data: JobApplicationEmailData): string {
  let text = `
New Job Application - Dev Global Jobs
======================================

Dear ${data.recruiterName || "Hiring Manager"},

A candidate has applied for your position through Dev Global Jobs.

POSITION APPLIED FOR
--------------------
Job Title: ${data.jobTitle}
Company: ${data.companyName}

CANDIDATE INFORMATION
---------------------
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
  if (data.cvUrl) links.push(`CV/Resume: ${data.cvUrl}`);

  if (links.length > 0) {
    text += `
DOCUMENTS & LINKS
-----------------
${links.join("\n")}
`;
  }

  text += `
--------------------------------------
Reply directly to this email to contact the candidate.
This application was submitted via Dev Global Jobs (devglobaljobs.com)
A service by Trend Nova World Ltd.
`;

  return text.trim();
}
