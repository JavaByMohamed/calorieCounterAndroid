// ============================================================
// EmailJS Configuration
// Replace these with your actual EmailJS credentials
// Get them from: https://www.emailjs.com
// ============================================================

const EMAIL_CONFIG = {
  publicKey: "yrU1yUCwjHFRULg25",       // EmailJS > Account > API Keys
  serviceId: "service_8550uys",        // EmailJS > Email Services > Service ID
  templateId: "template_phn0cd2",      // EmailJS > Email Templates > Template ID
};

// Initialize EmailJS
function initEmailService() {
  if (typeof emailjs !== "undefined") {
    emailjs.init(EMAIL_CONFIG.publicKey);
    console.log("✅ EmailJS initialized");
    return true;
  } else {
    console.warn("⚠️ EmailJS SDK not loaded. Falling back to demo mode.");
    return false;
  }
}

/**
 * Send a verification code email
 * @param {string} toEmail - Recipient email address
 * @param {string} toName - Recipient name
 * @param {string} code - The 6-digit verification code
 * @param {string} purpose - "verification" or "reset"
 * @returns {Promise<boolean>} - true if sent successfully
 */
async function sendVerificationEmail(toEmail, toName, code, purpose = "verification") {
  const subject = purpose === "reset"
    ? `Password Reset Code: ${code}`
    : `Email Verification Code: ${code}`;

  const templateParams = {
    email: toEmail,
    to_name: toName,
    code: code,
    purpose: purpose === "reset" ? "reset your password" : "verify your email",
  };

  // Check if EmailJS is available and configured
  if (typeof emailjs === "undefined" || EMAIL_CONFIG.publicKey === "YOUR_PUBLIC_KEY") {
    console.warn("📧 EmailJS not configured. Code displayed in demo mode:", code);
    return false; // Indicates demo mode (code shown on screen)
  }

  try {
    console.log("📧 Attempting to send email via EmailJS...", {
      serviceId: EMAIL_CONFIG.serviceId,
      templateId: EMAIL_CONFIG.templateId,
      to: toEmail,
    });
    const response = await emailjs.send(
      EMAIL_CONFIG.serviceId,
      EMAIL_CONFIG.templateId,
      templateParams
    );
    console.log("📧 Email sent successfully:", response.status, response.text);
    return true; // Email actually sent
  } catch (error) {
    console.error("❌ Failed to send email. Status:", error?.status, "Text:", error?.text, "Full error:", error);
    console.warn("📧 Falling back to demo mode — code will be shown on screen.");
    return false; // Fall back to demo mode (code shown on screen)
  }
}

/**
 * Check if EmailJS is properly configured (not using placeholder keys)
 */
function isEmailConfigured() {
  return (
    typeof emailjs !== "undefined" &&
    EMAIL_CONFIG.publicKey !== "YOUR_PUBLIC_KEY" &&
    EMAIL_CONFIG.serviceId !== "YOUR_SERVICE_ID" &&
    EMAIL_CONFIG.templateId !== "YOUR_TEMPLATE_ID"
  );
}


