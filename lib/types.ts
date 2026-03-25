// Shared definitions safe for client/server

export enum UserRole {
    ADMIN = 'ADMIN',
    MANAGER = 'MANAGER',
    EMPLOYEE = 'EMPLOYEE',
}

export enum ExpenseCategory {
    TRAVEL = 'TRAVEL',
    MEALS = 'MEALS',
    SUPPLIES = 'SUPPLIES',
    SOFTWARE = 'SOFTWARE',
    OTHER = 'OTHER',
}

export enum ExpenseStatus {
    DRAFT = 'DRAFT',
    SUBMITTED = 'SUBMITTED',
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
}

export enum StepType {
    ROLE = 'ROLE',
    USER = 'USER',
}



export enum ActionType {
    APPROVE = 'APPROVE',
    REJECT = 'REJECT',
    OVERRIDE_APPROVE = 'OVERRIDE_APPROVE',
    OVERRIDE_REJECT = 'OVERRIDE_REJECT',
}

export interface User {
    id: string;
    _id?: string;
    name: string;
    email: string;
    role: UserRole;
    managerId?: User | string | null; // Populated or ID
    isDisabled: boolean;
    createdAt?: string | Date;
}

export interface Expense {
    _id: string;
    companyId: string;
    employeeId: User; // Populated
    amountOriginal: number;
    currencyOriginal: string;
    amountCompany: number;
    companyCurrency: string;
    fxRate: number;
    fxDate: string | Date;
    category: ExpenseCategory;
    description: string;
    expenseDate: string | Date;
    status: ExpenseStatus;
    currentStepIndex: number;
    isAutoApproved?: boolean;
    createdAt: string | Date;
    updatedAt: string | Date;
}
