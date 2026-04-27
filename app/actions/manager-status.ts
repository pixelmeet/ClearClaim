"use server";

import { getCurrentUserAction } from "./auth";
import connectToDatabase from "@/lib/db";
import User from "@/models/User";
import PolicyRule, { StepApproverType } from "@/models/PolicyRule";

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

    // 2. Check if any active policy includes manager approval steps
    const managerStepRule = await PolicyRule.findOne({
      companyId: session.companyId,
      active: true,
      "steps.approverType": StepApproverType.MANAGER,
    }).select("_id");
    
    return {
      success: true,
      hasManager: !!user.managerId,
      isManagerFirstEnabled: !!managerStepRule,
    };
  } catch (error) {
    console.error("Error in getManagerStatusAction:", error);
    return { success: false, error: "Failed to fetch manager status" };
  }
}
