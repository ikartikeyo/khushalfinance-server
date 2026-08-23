import { config } from '../config/index.js';

/**
 * Send transactional email using Brevo (Sendinblue) REST API v3
 */
export async function sendEmail({ to, toName, subject, html, text }) {
  if (!to) return null;

  const apiKey = config.email.brevoApiKey;
  if (!apiKey) {
    console.log(`\n================== [SIMULATED EMAIL - NO API KEY] ==================`);
    console.log(`To: ${to} (${toName || 'User'})`);
    console.log(`Subject: ${subject}`);
    console.log(`Text: ${text || 'HTML content'}`);
    console.log(`====================================================================\n`);
    return { simulated: true };
  }

  try {
    const payload = {
      sender: {
        name: config.email.fromName,
        email: config.email.from,
      },
      to: [
        {
          email: to.trim().toLowerCase(),
          name: toName || to.split('@')[0],
        },
      ],
      subject,
      htmlContent: html,
      textContent: text || subject,
    };

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(`❌ Brevo API Error [${response.status}]:`, data);
      return { success: false, error: data };
    }

    console.log(`📧 Brevo Email successfully sent to ${to}: ${data.messageId || 'Success'}`);
    return { success: true, messageId: data.messageId };
  } catch (error) {
    console.error(`❌ Brevo network dispatch failed to ${to}:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * 1. Notify Consumer and Admin on New Loan Application
 */
export async function notifyApplicationReceived(enquiry) {
  const clientUrl = config.clientUrl.replace(/\/$/, '');
  const trackingUrl = `${clientUrl}/track?ref=${encodeURIComponent(enquiry.refNumber)}`;
  const adminUrl = `${clientUrl}/admin`;

  // ── A. EMAIL TO CONSUMER ──────────────────────────────────────────────────
  if (enquiry.email) {
    const consumerSubject = `Loan Application Received - Ref #${enquiry.refNumber} | Khushal Finance`;
    const consumerHtml = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #0b1120; padding: 30px 15px; color: #f8fafc;">
        <div style="max-width: 600px; margin: 0 auto; background: #0f172a; border: 1px solid #1e293b; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #1e3a8a 0%, #1e6fff 100%); padding: 28px 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 26px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">Khushal <span style="color: #93c5fd;">Finance</span></h1>
            <p style="margin: 4px 0 0 0; color: #dbeafe; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; font-weight: 600;">Financial Services & Loan Broker</p>
          </div>

          <!-- Body Content -->
          <div style="padding: 28px 24px; color: #e2e8f0; line-height: 1.6;">
            <h2 style="color: #ffffff; margin-top: 0; font-size: 20px;">Dear ${enquiry.firstName} ${enquiry.lastName},</h2>
            <p style="font-size: 14px; color: #cbd5e1;">
              Thank you for submitting your loan application! We have received your application for <strong>${enquiry.loanType}</strong>. Our advisory team will compare offers across our <strong>50+ partner banks & NBFCs</strong> to secure the lowest interest rates for you.
            </p>

            <!-- Reference Number Card -->
            <div style="background: rgba(30, 111, 255, 0.12); border: 1px solid #1e6fff; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
              <p style="margin: 0; font-size: 12px; text-transform: uppercase; letter-spacing: 1.5px; color: #93c5fd; font-weight: 700;">Your Application Reference Number</p>
              <p style="margin: 8px 0 0 0; font-size: 26px; font-weight: 900; color: #ffffff; font-family: monospace; letter-spacing: 2px;">${enquiry.refNumber}</p>
              <p style="margin: 6px 0 0 0; font-size: 11px; color: #94a3b8;">Keep this reference number safe to track your live status.</p>
            </div>

            <!-- Application Summary Table -->
            <div style="background: #1e293b; border-radius: 10px; padding: 16px 20px; margin-bottom: 24px;">
              <h3 style="margin: 0 0 12px 0; font-size: 13px; text-transform: uppercase; color: #38bdf8; letter-spacing: 1px;">Application Summary</h3>
              <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                <tr>
                  <td style="padding: 8px 0; color: #94a3b8; border-bottom: 1px solid #334155;">Loan Product:</td>
                  <td style="padding: 8px 0; font-weight: 700; color: #f8fafc; text-align: right; border-bottom: 1px solid #334155;">${enquiry.loanType}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #94a3b8; border-bottom: 1px solid #334155;">Requested Amount:</td>
                  <td style="padding: 8px 0; font-weight: 800; color: #34d399; text-align: right; border-bottom: 1px solid #334155;">₹${Number(enquiry.loanAmount).toLocaleString('en-IN')}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #94a3b8; border-bottom: 1px solid #334155;">Tenure:</td>
                  <td style="padding: 8px 0; font-weight: 700; color: #f8fafc; text-align: right; border-bottom: 1px solid #334155;">${enquiry.tenure} Years (${enquiry.tenure * 12} EMIs)</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #94a3b8;">Estimated Monthly EMI:</td>
                  <td style="padding: 8px 0; font-weight: 800; color: #f59e0b; text-align: right;">₹${Number(enquiry.calculatedEmi || 0).toLocaleString('en-IN')} / mo</td>
                </tr>
              </table>
            </div>

            <!-- Tracking Button CTA -->
            <div style="text-align: center; margin: 30px 0 20px 0;">
              <a href="${trackingUrl}" style="background: linear-gradient(135deg, #1e6fff 0%, #0052cc 100%); color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 10px; font-weight: 800; font-size: 15px; display: inline-block; box-shadow: 0 4px 15px rgba(30,111,255,0.4);">
                Track Application Live ➔
              </a>
              <p style="margin: 10px 0 0 0; font-size: 12px; color: #64748b;">
                Direct link: <a href="${trackingUrl}" style="color: #38bdf8; text-decoration: underline;">${trackingUrl}</a>
              </p>
            </div>

            <p style="font-size: 13px; color: #94a3b8; margin-top: 24px;">
              Our dedicated loan officer will contact you on <strong>${enquiry.mobile}</strong> within <strong>24 business hours</strong>.
            </p>
          </div>

          <!-- Footer -->
          <div style="background: #090d16; padding: 20px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #1e293b;">
            <p style="margin: 0 0 4px 0; font-weight: 600; color: #94a3b8;">Khushal Finance — Financial Services & Loan Broker</p>
            <p style="margin: 0;">Phone: <a href="tel:+919579570773" style="color: #38bdf8;">+91 95795 70773</a> &bull; Email: <a href="mailto:khushalfinance12@gmail.com" style="color: #38bdf8;">khushalfinance12@gmail.com</a></p>
          </div>
        </div>
      </div>
    `;

    sendEmail({
      to: enquiry.email,
      toName: `${enquiry.firstName} ${enquiry.lastName}`,
      subject: consumerSubject,
      html: consumerHtml,
      text: `Dear ${enquiry.firstName}, your loan application (${enquiry.refNumber}) for ${enquiry.loanType} (₹${Number(enquiry.loanAmount).toLocaleString('en-IN')}) has been received. Track status at: ${trackingUrl}`,
    }).catch((e) => console.error('Consumer email error:', e.message));
  }

  // ── B. EMAIL TO ADMIN ──────────────────────────────────────────────────────
  const adminEmail = config.email.adminEmail;
  if (adminEmail) {
    const adminSubject = `🚨 New Loan Application: ${enquiry.refNumber} - ${enquiry.firstName} ${enquiry.lastName} (₹${Number(enquiry.loanAmount).toLocaleString('en-IN')})`;
    const adminHtml = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #0b1120; padding: 24px 15px; color: #f8fafc;">
        <div style="max-width: 600px; margin: 0 auto; background: #0f172a; border: 1px solid #1e293b; border-radius: 14px; padding: 24px;">
          <div style="border-bottom: 1px solid #334155; padding-bottom: 16px; margin-bottom: 16px;">
            <h2 style="margin: 0; color: #38bdf8; font-size: 20px;">New Loan Application Received</h2>
            <p style="margin: 4px 0 0 0; color: #94a3b8; font-size: 13px;">Reference Number: <strong style="color: #ffffff; font-family: monospace;">${enquiry.refNumber}</strong></p>
          </div>

          <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 20px;">
            <tr><td style="padding: 6px 0; color: #94a3b8;">Applicant Name:</td><td style="font-weight: 700; color: #ffffff; text-align: right;">${enquiry.firstName} ${enquiry.lastName}</td></tr>
            <tr><td style="padding: 6px 0; color: #94a3b8;">Mobile Number:</td><td style="font-weight: 700; color: #38bdf8; text-align: right;"><a href="tel:${enquiry.mobile}" style="color: #38bdf8;">${enquiry.mobile}</a></td></tr>
            <tr><td style="padding: 6px 0; color: #94a3b8;">Email Address:</td><td style="font-weight: 700; color: #ffffff; text-align: right;">${enquiry.email || 'N/A'}</td></tr>
            <tr><td style="padding: 6px 0; color: #94a3b8;">PAN Number:</td><td style="font-weight: 700; color: #f59e0b; text-align: right; font-family: monospace;">${enquiry.pan}</td></tr>
            <tr><td style="padding: 6px 0; color: #94a3b8;">Requested Loan:</td><td style="font-weight: 700; color: #ffffff; text-align: right;">${enquiry.loanType}</td></tr>
            <tr><td style="padding: 6px 0; color: #94a3b8;">Loan Amount:</td><td style="font-weight: 800; color: #34d399; text-align: right;">₹${Number(enquiry.loanAmount).toLocaleString('en-IN')}</td></tr>
            <tr><td style="padding: 6px 0; color: #94a3b8;">Monthly Income:</td><td style="font-weight: 700; color: #ffffff; text-align: right;">₹${Number(enquiry.monthlyIncome).toLocaleString('en-IN')}</td></tr>
            <tr><td style="padding: 6px 0; color: #94a3b8;">Employment Type:</td><td style="font-weight: 700; color: #ffffff; text-align: right;">${enquiry.employmentType} (${enquiry.employer || 'N/A'})</td></tr>
            <tr><td style="padding: 6px 0; color: #94a3b8;">Automated Risk Tier:</td><td style="font-weight: 800; color: ${enquiry.riskCategory === 'LOW' ? '#34d399' : enquiry.riskCategory === 'HIGH' ? '#ef4444' : '#f59e0b'}; text-align: right;">${enquiry.riskCategory || 'Assessed'}</td></tr>
          </table>

          <div style="text-align: center; margin-top: 20px;">
            <a href="${adminUrl}" style="background: #1e6fff; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 14px; display: inline-block;">
              Open Admin Portal ➔
            </a>
          </div>
        </div>
      </div>
    `;

    sendEmail({
      to: adminEmail,
      toName: 'Khushal Finance Admin',
      subject: adminSubject,
      html: adminHtml,
      text: `New loan application ${enquiry.refNumber} from ${enquiry.firstName} ${enquiry.lastName} for ${enquiry.loanType} (₹${Number(enquiry.loanAmount).toLocaleString('en-IN')}). Phone: ${enquiry.mobile}`,
    }).catch((e) => console.error('Admin notification error:', e.message));
  }
}

/**
 * 2. Notify Consumer on Every Status Update by Admin
 */
export async function notifyStatusChange(enquiry, newStatus, remarks) {
  if (!enquiry || !enquiry.email) return;

  const clientUrl = config.clientUrl.replace(/\/$/, '');
  const trackingUrl = `${clientUrl}/track?ref=${encodeURIComponent(enquiry.refNumber)}`;

  const statusConfig = {
    SUBMITTED: { label: 'Application Submitted', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.15)' },
    UNDER_REVIEW: { label: 'Under Review by Advisory Team', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' },
    DOCUMENT_VERIFICATION: { label: 'Data & Verification In-Progress', color: '#818cf8', bg: 'rgba(129, 140, 248, 0.15)' },
    IN_PRINCIPLE_APPROVED: { label: 'In-Principle Approved 🎉', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.2)' },
    APPROVED: { label: 'Loan Sanction Approved ✅', color: '#34d399', bg: 'rgba(52, 211, 153, 0.2)' },
    REJECTED: { label: 'Application Closed / Rejected', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' },
    DISBURSED: { label: 'Funds Disbursed to Bank Account 💰', color: '#10b981', bg: 'rgba(16, 185, 129, 0.2)' },
  };

  const current = statusConfig[newStatus] || { label: newStatus.replace(/_/g, ' '), color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.15)' };

  const subject = `Status Update: Loan Ref #${enquiry.refNumber} is now ${current.label} | Khushal Finance`;
  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #0b1120; padding: 30px 15px; color: #f8fafc;">
      <div style="max-width: 600px; margin: 0 auto; background: #0f172a; border: 1px solid #1e293b; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #1e3a8a 0%, #1e6fff 100%); padding: 24px 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #ffffff;">Khushal Finance</h1>
          <p style="margin: 4px 0 0 0; color: #dbeafe; font-size: 12px; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 600;">Application Status Update</p>
        </div>

        <div style="padding: 28px 24px; color: #e2e8f0; line-height: 1.6;">
          <p style="font-size: 15px; margin-top: 0;">Dear <strong>${enquiry.firstName} ${enquiry.lastName}</strong>,</p>
          <p style="font-size: 14px; color: #cbd5e1;">
            The status of your loan application (Reference: <strong style="color: #38bdf8; font-family: monospace;">${enquiry.refNumber}</strong>) has been updated by our loan underwriting team:
          </p>

          <!-- Status Highlight Card -->
          <div style="background: ${current.bg}; border: 1.5px solid ${current.color}; border-radius: 12px; padding: 18px 20px; text-align: center; margin: 22px 0;">
            <p style="margin: 0; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; font-weight: 600;">Current Application Stage</p>
            <p style="margin: 6px 0 0 0; font-size: 20px; font-weight: 800; color: ${current.color};">${current.label}</p>
          </div>

          ${
            remarks
              ? `
            <div style="background: #1e293b; border-left: 4px solid ${current.color}; padding: 14px 16px; border-radius: 6px; margin: 20px 0; font-size: 13px;">
              <strong style="color: #f8fafc;">Advisory Remarks / Notes:</strong>
              <p style="margin: 4px 0 0 0; color: #cbd5e1;">${remarks}</p>
            </div>
          `
              : ''
          }

          <!-- Tracking Link Button -->
          <div style="text-align: center; margin: 28px 0 20px 0;">
            <a href="${trackingUrl}" style="background: linear-gradient(135deg, #1e6fff 0%, #0052cc 100%); color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 14px; display: inline-block;">
              View Live Tracker & Timeline ➔
            </a>
            <p style="margin: 8px 0 0 0; font-size: 11px; color: #64748b;">
              Direct link: <a href="${trackingUrl}" style="color: #38bdf8;">${trackingUrl}</a>
            </p>
          </div>

          <p style="font-size: 13px; color: #94a3b8; margin-top: 24px;">
            If you have any questions regarding this status update, please feel free to call us at <strong style="color: #f8fafc;">+91 95795 70773</strong> or reply directly to this email.
          </p>
        </div>

        <!-- Footer -->
        <div style="background: #090d16; padding: 16px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #1e293b;">
          Khushal Finance &bull; Registered Loan & Financial Services Broker &bull; <a href="mailto:khushalfinance12@gmail.com" style="color: #38bdf8;">khushalfinance12@gmail.com</a>
        </div>
      </div>
    </div>
  `;

  return sendEmail({
    to: enquiry.email,
    toName: `${enquiry.firstName} ${enquiry.lastName}`,
    subject,
    html,
    text: `Dear ${enquiry.firstName}, your loan application (${enquiry.refNumber}) status is now: ${current.label}. ${remarks ? `Remarks: ${remarks}` : ''} Track at: ${trackingUrl}`,
  });
}

/**
 * 3. Notify Consumer and Admin on Quick Enquiry (Contact Form / Hero Quote)
 */
export async function notifyContactEnquiry(contact) {
  const clientUrl = config.clientUrl.replace(/\/$/, '');
  const applyUrl = `${clientUrl}/enquiry?type=${encodeURIComponent(contact.loanType || '')}&amount=${contact.loanAmount || ''}`;
  const adminUrl = `${clientUrl}/admin`;

  // ── A. EMAIL TO CONSUMER (if email provided) ──────────────────────────────
  if (contact.email) {
    const consumerSubject = `Quick Enquiry Received | Khushal Finance`;
    const consumerHtml = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #0b1120; padding: 28px 15px; color: #f8fafc;">
        <div style="max-width: 600px; margin: 0 auto; background: #0f172a; border: 1px solid #1e293b; border-radius: 14px; overflow: hidden; box-shadow: 0 8px 20px rgba(0,0,0,0.5);">
          
          <div style="background: linear-gradient(135deg, #1e3a8a 0%, #1e6fff 100%); padding: 24px 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #ffffff;">Khushal Finance</h1>
            <p style="margin: 4px 0 0 0; color: #dbeafe; font-size: 12px; text-transform: uppercase; letter-spacing: 1.5px;">Loan Advisory & Brokerage</p>
          </div>

          <div style="padding: 24px; color: #e2e8f0; line-height: 1.6;">
            <h2 style="color: #ffffff; margin-top: 0; font-size: 18px;">Hello ${contact.fullName},</h2>
            <p style="font-size: 14px; color: #cbd5e1;">
              Thank you for submitting your quick loan enquiry! Your enquiry for <strong>${contact.loanType || 'Financial Services'}</strong> has been received by our brokerage desk.
            </p>

            <div style="background: #1e293b; border-radius: 10px; padding: 14px 18px; margin: 18px 0; font-size: 13px;">
              <p style="margin: 0 0 6px 0; color: #94a3b8;">Requested Product: <strong style="color: #38bdf8;">${contact.loanType || 'General Enquiry'}</strong></p>
              ${contact.loanAmount ? `<p style="margin: 0 0 6px 0; color: #94a3b8;">Requested Amount: <strong style="color: #34d399;">₹${Number(contact.loanAmount).toLocaleString('en-IN')}</strong></p>` : ''}
              ${contact.tenure ? `<p style="margin: 0; color: #94a3b8;">Preferred Tenure: <strong style="color: #f8fafc;">${contact.tenure} Years</strong></p>` : ''}
            </div>

            <p style="font-size: 14px; color: #cbd5e1;">
              Our dedicated finance advisor will reach out to you shortly on <strong>${contact.mobile}</strong> to present the best loan offers from top banks.
            </p>

            <div style="text-align: center; margin: 26px 0 16px 0;">
              <a href="${applyUrl}" style="background: #1e6fff; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 13px; display: inline-block;">
                Complete Full Application Online ➔
              </a>
            </div>
          </div>

          <div style="background: #090d16; padding: 16px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #1e293b;">
            Khushal Finance &bull; Phone: +91 95795 70773 &bull; Email: khushalfinance12@gmail.com
          </div>
        </div>
      </div>
    `;

    sendEmail({
      to: contact.email,
      toName: contact.fullName,
      subject: consumerSubject,
      html: consumerHtml,
      text: `Hello ${contact.fullName}, your quick loan enquiry for ${contact.loanType || 'Loan'} has been received. Our team will contact you shortly on ${contact.mobile}.`,
    }).catch((e) => console.error('Quick lead consumer email error:', e.message));
  }

  // ── B. EMAIL TO ADMIN ──────────────────────────────────────────────────────
  const adminEmail = config.email.adminEmail;
  if (adminEmail) {
    const adminSubject = `⚡ New Quick Lead: ${contact.fullName} - ${contact.mobile} (${contact.loanType || 'General Enquiry'})`;
    const adminHtml = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #0b1120; padding: 24px 15px; color: #f8fafc;">
        <div style="max-width: 600px; margin: 0 auto; background: #0f172a; border: 1px solid #1e293b; border-radius: 12px; padding: 22px;">
          <h2 style="margin: 0 0 12px 0; color: #f59e0b; font-size: 18px;">⚡ New Quick Enquiry Lead Received</h2>
          
          <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 18px;">
            <tr><td style="padding: 5px 0; color: #94a3b8;">Customer Name:</td><td style="font-weight: 700; color: #ffffff; text-align: right;">${contact.fullName}</td></tr>
            <tr><td style="padding: 5px 0; color: #94a3b8;">Mobile Number:</td><td style="font-weight: 700; color: #38bdf8; text-align: right;"><a href="tel:${contact.mobile}" style="color: #38bdf8;">${contact.mobile}</a></td></tr>
            <tr><td style="padding: 5px 0; color: #94a3b8;">Email Address:</td><td style="font-weight: 700; color: #ffffff; text-align: right;">${contact.email || 'Not provided'}</td></tr>
            <tr><td style="padding: 5px 0; color: #94a3b8;">Loan Preference:</td><td style="font-weight: 700; color: #ffffff; text-align: right;">${contact.loanType || 'General Enquiry'}</td></tr>
            <tr><td style="padding: 5px 0; color: #94a3b8;">Requested Amount:</td><td style="font-weight: 800; color: #34d399; text-align: right;">${contact.loanAmount ? `₹${Number(contact.loanAmount).toLocaleString('en-IN')}` : 'Unspecified'}</td></tr>
            <tr><td style="padding: 5px 0; color: #94a3b8;">Location / Address:</td><td style="color: #cbd5e1; text-align: right;">${contact.address || 'Not specified'}</td></tr>
          </table>

          <div style="text-align: center;">
            <a href="${adminUrl}" style="background: #1e6fff; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: 700; font-size: 13px; display: inline-block;">
              View Lead in Admin Portal ➔
            </a>
          </div>
        </div>
      </div>
    `;

    sendEmail({
      to: adminEmail,
      toName: 'Khushal Finance Admin',
      subject: adminSubject,
      html: adminHtml,
      text: `New quick lead from ${contact.fullName} (${contact.mobile}) for ${contact.loanType || 'General Enquiry'}. Amount: ${contact.loanAmount || 'N/A'}`,
    }).catch((e) => console.error('Admin quick lead notification error:', e.message));
  }
}
