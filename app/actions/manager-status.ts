"use server";

import { getCurrentUserAction } from "./auth";
import { getApprovalFlow } from "@/lib/approvalEngine";
import connectToDatabase from "@/lib/db";
import User from "@/models/User";

export async function getManagerStatusAction() {
  const session = await getCurrentUserAction();
  if (!session) {
    return { success: false, error: "Not authenticated" };
  }

  await connectToDatabase();

  try {
    // 1. Fetch the user document to check for managerId
    const user = await User.findById(session.userId);
    if (!user) {
      return { success: false, error: "User not found" };
    }

    // 2. Check if manager-first approval is enabled for the company
    const flow = await getApprovalFlow(session.companyId);
    
    return {
      success: true,
      hasManager: !!user.managerId,
      isManagerFirstEnabled: !!flow?.isManagerApprover,
    };
  } catch (error) {
    console.error("Error in getManagerStatusAction:", error);
    return { success: false, error: "Failed to fetch manager status" };
  }
}
