import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT ?? 587),
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

export async function sendApprovalNeededEmail(opts: {
  to: string;
  approverName: string;
  employeeName: string;
  amount: number;
  currency: string;
  expenseId: string;
}) {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: opts.to,
      subject: `Action required: expense approval for ${opts.employeeName}`,
      text: `Hi ${opts.approverName},\n\n${opts.employeeName} submitted an expense of ${opts.currency} ${opts.amount} that requires your approval.\n\nView it at: ${process.env.NEXT_PUBLIC_BASE_URL}/manager/approvals\n`,
    });
  } catch (error) {
    console.error('Email Notification Failed (Approval Needed):', error);
  }
}

export async function sendExpenseStatusEmail(opts: {
  to: string;
  employeeName: string;
  status: 'APPROVED' | 'REJECTED';
  amount: number;
  currency: string;
  comment?: string;
}) {
  const verb = opts.status === 'APPROVED' ? 'approved' : 'rejected';
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: opts.to,
      subject: `Your expense has been ${verb}`,
      text: `Hi ${opts.employeeName},\n\nYour expense of ${opts.currency} ${opts.amount} has been ${verb}.\n${opts.comment ? `Comment: ${opts.comment}` : ''}\n`,
    });
  } catch (error) {
    console.error('Email Notification Failed (Status Update):', error);
  }
}

