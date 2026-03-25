import { GET as getExpenseById } from '@/app/api/expenses/[id]/route';jest.mock('@/lib/auth', () => ({
  getSession: jest.fn(),
}));

jest.mock('@/lib/db', () => ({
  __esModule: true,
  default: jest.fn(async () => undefined),
}));

jest.mock('@/models/Expense', () => ({
  __esModule: true,
  default: {
    findOne: jest.fn(),
  },
}));

describe('Tenant isolation (route handler query scoping)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('GET /api/expenses/[id] scopes by companyId', async () => {
    const { getSession } = await import('@/lib/auth');
    const Expense = (await import('@/models/Expense')).default as any;

    (getSession as any).mockResolvedValue({
      userId: 'userA',
      companyId: 'companyA',
      role: 'ADMIN',
    });

    Expense.findOne.mockReturnValue({
      populate: () => ({
        populate: () => null,
      }),
    });

    // Minimal NextRequest-like object
    const req: any = { url: 'http://localhost/api/expenses/exp123' };
    await getExpenseById(req, { params: Promise.resolve({ id: 'exp123' }) });

    expect(Expense.findOne).toHaveBeenCalledWith({
      _id: 'exp123',
      companyId: 'companyA',
    });
  });
});

