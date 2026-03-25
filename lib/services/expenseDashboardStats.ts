import mongoose from 'mongoose';
import Expense from '@/models/Expense';
import User from '@/models/User';
import { ExpenseStatus } from '@/lib/types';

const usersCollectionName =
  User.collection?.name ?? 'users';

export type DashboardExpenseAgg = {
  totalAmount: number;
  pendingCount: number;
  approvedCount: number;
  companyCurrency: string;
};

const pendingStatuses = [ExpenseStatus.PENDING, ExpenseStatus.SUBMITTED];

export async function getEmployeeExpenseDashboardStats(
  companyId: string,
  employeeId: string
): Promise<DashboardExpenseAgg> {
  const companyOid = new mongoose.Types.ObjectId(companyId);
  const employeeOid = new mongoose.Types.ObjectId(employeeId);

  const [row] = await Expense.aggregate<DashboardExpenseAgg>([
    {
      $match: {
        companyId: companyOid,
        employeeId: employeeOid,
      },
    },
    {
      $group: {
        _id: null,
        totalAmount: { $sum: '$amountCompany' },
        pendingCount: {
          $sum: {
            $cond: [{ $in: ['$status', pendingStatuses] }, 1, 0],
          },
        },
        approvedCount: {
          $sum: {
            $cond: [{ $eq: ['$status', ExpenseStatus.APPROVED] }, 1, 0],
          },
        },
        companyCurrency: { $first: '$companyCurrency' },
      },
    },
  ]);

  return (
    row ?? {
      totalAmount: 0,
      pendingCount: 0,
      approvedCount: 0,
      companyCurrency: 'INR',
    }
  );
}

export async function getManagerTeamExpenseDashboardStats(
  companyId: string,
  managerUserId: string
): Promise<DashboardExpenseAgg> {
  const companyOid = new mongoose.Types.ObjectId(companyId);
  const managerOid = new mongoose.Types.ObjectId(managerUserId);

  const [row] = await Expense.aggregate<DashboardExpenseAgg>([
    { $match: { companyId: companyOid } },
    {
      $lookup: {
        from: usersCollectionName,
        localField: 'employeeId',
        foreignField: '_id',
        as: '_emp',
      },
    },
    { $unwind: '$_emp' },
    {
      $match: {
        '_emp.managerId': managerOid,
        '_emp.companyId': companyOid,
      },
    },
    {
      $group: {
        _id: null,
        totalAmount: { $sum: '$amountCompany' },
        pendingCount: {
          $sum: {
            $cond: [{ $in: ['$status', pendingStatuses] }, 1, 0],
          },
        },
        approvedCount: {
          $sum: {
            $cond: [{ $eq: ['$status', ExpenseStatus.APPROVED] }, 1, 0],
          },
        },
        companyCurrency: { $first: '$companyCurrency' },
      },
    },
  ]);

  return (
    row ?? {
      totalAmount: 0,
      pendingCount: 0,
      approvedCount: 0,
      companyCurrency: 'INR',
    }
  );
}
