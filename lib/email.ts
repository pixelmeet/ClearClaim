import nodemailer from "nodemailer";

let transporterInstance: nodemailer.Transporter | null = null;

function getTransporter() {
  if (transporterInstance) return transporterInstance;

  const requiredEnvVars = [
    "EMAIL_HOST",
    "EMAIL_PORT",
    "EMAIL_USER",
    "EMAIL_PASS",
    "EMAIL_FROM",
  ];
  const missingEnvVars = requiredEnvVars.filter((v) => !process.env[v]);

  if (missingEnvVars.length > 0) {
    console.warn(
      `Warning: Missing environment variables for email: ${missingEnvVars.join(", ")}. Emails will not be sent.`
    );
  }

  const host = process.env.EMAIL_HOST;
  const port = parseInt(process.env.EMAIL_PORT || "587");
  const user = process.env.EMAIL_USER;
  let pass = process.env.EMAIL_PASS || "";

  // Gmail app passwords are often pasted with spaces; SMTP expects raw token.
  if (host?.includes("gmail.com")) {
    pass = pass.replace(/\s+/g, "");
  } else {
    pass = pass.trim();
  }

  transporterInstance = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  });

  return transporterInstance;
}

/**
 * Sends a One-Time Password (OTP) email to a specified recipient.
 * @param to The recipient's email address.
 * @param otp The 6-digit code to be sent.
 */
export async function sendOTPEmail(
  to: string,
  otp: string,
  purpose: "signup" | "password_reset" = "password_reset"
) {
  try {
    const transporter = getTransporter();
    await transporter.verify();
    const isSignup = purpose === "signup";
    const subject = isSignup
      ? "Verify Your Account"
      : "Your Password Reset Code";
    const heading = isSignup ? "Verify Your Email" : "Password Reset Request";
    const intro = isSignup
      ? "Welcome! Use the code below to verify your account and complete signup."
      : "We received a request to reset your password. Use the code below to complete the process.";
    const footer = isSignup
      ? "If you did not create this account, please ignore this email."
      : "If you did not request a password reset, please ignore this email.";
    const info = await transporter.sendMail({
      from: `"${process.env.APP_NAME || "Your App"}" <${process.env.EMAIL_FROM || "noreply@example.com"}>`,
      to: to,
      subject,
      text: `Your One-Time Password (OTP) is: ${otp}. It expires in 10 minutes.`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
          <h2 style="color: #333;">${heading}</h2>
          <p>${intro}</p>
          <p style="font-size: 24px; font-weight: bold; letter-spacing: 4px; text-align: center; background-color: #f5f5f5; padding: 15px; border-radius: 5px;">
            ${otp}
          </p>
          <p>This code will expire in 10 minutes. ${footer}</p>
        </div>
      `,
    });

    if (!info.accepted || info.accepted.length === 0) {
      throw new Error(
        `Email was not accepted by SMTP provider. Rejected: ${info.rejected.join(", ")}`
      );
    }

    console.log("Message sent successfully: %s", info.messageId);
    console.log("Email accepted recipients:", info.accepted.join(", "));
    if (info.rejected.length > 0) {
      console.warn("Email rejected recipients:", info.rejected.join(", "));
    }
    if (process.env.NODE_ENV !== "production") {
      console.log(`[DEV] OTP for ${to}: ${otp}`);
    }
  } catch (error) {
    console.error("Error sending email:", error);

    throw new Error("Failed to send verification email.");
  }
}