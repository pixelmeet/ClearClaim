'use server';

import { getSessionUser } from '@/lib/auth/getSessionUser';
import { logoutUser } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import ApprovalRule from '@/models/ApprovalRule';

export async function getCurrentUserAction() {
  const session = await getSessionUser();
  if (!session) return null;
  return {
    id: session.userId,
    userId: session.userId,
    name: session.name,
    email: session.email,
    role: session.role,
    companyId: session.companyId,
  };
}

export async function logoutAction() {
  await logoutUser();
}

export async function deleteApprovalRuleAction(ruleId: string) {
  const session = await getSessionUser();
  if (!session) {
    return { success: false, error: 'Not authenticated' };
  }

  if (session.role !== 'ADMIN') {
    return { success: false, error: 'Unauthorized: Admin access required' };
  }

  await connectToDatabase();

  const rule = await ApprovalRule.findById(ruleId);
  if (!rule) {
    return { success: false, error: 'Rule not found' };
  }

  if (rule.organization !== session.companyId) {
    return { success: false, error: 'Unauthorized: Organization mismatch' };
  }

  await ApprovalRule.findByIdAndDelete(ruleId);

  return {
    success: true,
    deletedRule: {
      id: rule._id?.toString(),
      ruleName: rule.ruleName,
    },
  };
}
