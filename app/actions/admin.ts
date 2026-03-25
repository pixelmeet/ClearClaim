"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/database";
import { GetUsersParams } from "@/types/pagination";
import { UserRole } from "@/types/roles";
import { getCurrentUserAction } from "./auth";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import connectToDatabase from "@/lib/db";
import UserMongoose from "@/models/User";
import mongoose from "mongoose";
import { UserRole as ExpenseMgmtRole } from "@/lib/types";
import { getSessionUser } from "@/lib/auth/getSessionUser";

export async function getAdminAnalyticsAction() {
  const db = await getDb();
  return db.getAdminAnalytics();
}

/** Company-scoped user stats via single aggregation (no full collection load). */
export async function getAdminCompanyUserStatsAction(): Promise<{
  totalUsers: number;
  managers: number;
  employees: number;
  disabled: number;
} | null> {
  const session = await getSessionUser();
  if (!session || session.role !== ExpenseMgmtRole.ADMIN) {
    return null;
  }

  await connectToDatabase();
  const companyOid = new mongoose.Types.ObjectId(session.companyId);

  const [row] = await UserMongoose.aggregate<{
    totalUsers: number;
    managers: number;
    employees: number;
    disabled: number;
  }>([
    { $match: { companyId: companyOid } },
    {
      $group: {
        _id: null,
        totalUsers: { $sum: 1 },
        managers: {
          $sum: { $cond: [{ $eq: ["$role", ExpenseMgmtRole.MANAGER] }, 1, 0] },
        },
        employees: {
          $sum: { $cond: [{ $eq: ["$role", ExpenseMgmtRole.EMPLOYEE] }, 1, 0] },
        },
        disabled: {
          $sum: { $cond: [{ $eq: ["$isDisabled", true] }, 1, 0] },
        },
      },
    },
  ]);

  if (!row) {
    return {
      totalUsers: 0,
      managers: 0,
      employees: 0,
      disabled: 0,
    };
  }

  return {
    totalUsers: row.totalUsers,
    managers: row.managers,
    employees: row.employees,
    disabled: row.disabled,
  };
}

export async function getUsersAction(params: GetUsersParams) {
  const db = await getDb();
  return db.getPaginatedUsers(params);
}

export async function createAdminUserAction(data: {
  fullName: string;
  email: string;
  role: UserRole;
  password?: string;
  [key: string]: unknown;
}) {
  const db = await getDb();
  const currentUser = await getCurrentUserAction();
  
  const existingUser = await db.findUserByEmail(data.email);
  if (existingUser)
    return { success: false, message: "User with this email already exists." };

  const password = data.password || Math.random().toString(36).slice(-12);
  const passwordHash = await bcrypt.hash(password, 10);

  // Extract extra fields
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { fullName, email, role, password: _, ...extraFields } = data;

  // Fetch creator's ObjectId for managerId assignment (Required for Mongoose refs)
  let creatorObjectId = null;
  if (currentUser?.id) {
    await connectToDatabase();
    const creator = await UserMongoose.findOne({ id: currentUser.id });
    if (creator) {
      creatorObjectId = creator._id;
    }
  }

  const newUser = {
    id: uuidv4(),
    fullName,
    email: email.toLowerCase(),
    role,
    passwordHash,
    ...extraFields,
    // Auto-assign manager if new user is a MANAGER (moderator) and creator is an ADMIN (admin)
    ...(role === "moderator" && creatorObjectId ? { managerId: creatorObjectId } : {})
  };

  await db.createUser(newUser);
  revalidatePath("/admin/users");
  return {
    success: true,
    message: `User created. Initial password: ${password}`,
  };
}

export async function updateAdminUserAction(
  id: string,
  data: { fullName: string; role: UserRole; [key: string]: unknown }
) {
  const db = await getDb();
  await db.updateUser(id, data);
  revalidatePath("/admin/users");
  return { success: true, message: "User updated successfully." };
}

export async function deleteAdminUserAction(id: string) {
  const db = await getDb();
  await db.deleteUserById(id);
  revalidatePath("/admin/users");
  return { success: true, message: "User deleted successfully." };
}