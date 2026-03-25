/**
 * Unit Tests for ApprovalFlow Validation (Zod schema)
 * Run: npm test -- --testPathPattern=approvalFlow
 */

import { validateApprovalFlow } from '@/lib/validators/approvalFlow';

describe('ApprovalFlow Zod Validation', () => {
    // ── Valid flow ──────────────────────────────────────────
    test('accepts a valid flow with USER + ROLE steps', () => {
        const result = validateApprovalFlow({
            name: 'Standard Flow',
            isManagerApprover: true,
            minApprovalPercent: 100,
            steps: [
                { type: 'USER', userId: '507f1f77bcf86cd799439011', required: true, autoApprove: false },
                { type: 'ROLE', role: 'ADMIN', required: false, autoApprove: false },
            ],
        });
        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
        expect(result.data!.steps).toHaveLength(2);
    });

    // ── Empty steps rejected ───────────────────────────────
    test('rejects flow with no steps', () => {
        const result = validateApprovalFlow({
            name: 'Empty Flow',
            isManagerApprover: false,
            minApprovalPercent: 100,
            steps: [],
        });
        expect(result.success).toBe(false);
        expect(result.errors).toEqual(
            expect.arrayContaining([expect.stringContaining('At least one')])
        );
    });

    // ── Required + AutoApprove conflict ────────────────────
    test('rejects step with both required and autoApprove', () => {
        const result = validateApprovalFlow({
            name: 'Conflict Flow',
            isManagerApprover: false,
            minApprovalPercent: 100,
            steps: [
                { type: 'USER', userId: '507f1f77bcf86cd799439011', required: true, autoApprove: true },
            ],
        });
        expect(result.success).toBe(false);
        expect(result.errors).toEqual(
            expect.arrayContaining([expect.stringContaining('required and autoApprove')])
        );
    });

    // ── Missing userId for USER step ───────────────────────
    test('rejects USER step without userId', () => {
        const result = validateApprovalFlow({
            name: 'Missing User',
            isManagerApprover: false,
            minApprovalPercent: 100,
            steps: [
                { type: 'USER', required: false, autoApprove: false },
            ],
        });
        expect(result.success).toBe(false);
        expect(result.errors).toEqual(
            expect.arrayContaining([expect.stringContaining('userId')])
        );
    });

    // ── Missing role for ROLE step ─────────────────────────
    test('rejects ROLE step without role', () => {
        const result = validateApprovalFlow({
            name: 'Missing Role',
            isManagerApprover: false,
            minApprovalPercent: 100,
            steps: [
                { type: 'ROLE', required: false, autoApprove: false },
            ],
        });
        expect(result.success).toBe(false);
        expect(result.errors).toEqual(
            expect.arrayContaining([expect.stringContaining('role')])
        );
    });

    // ── Duplicate userId ───────────────────────────────────
    test('rejects duplicate userId in steps', () => {
        const uid = '507f1f77bcf86cd799439011';
        const result = validateApprovalFlow({
            name: 'Duplicate Flow',
            isManagerApprover: false,
            minApprovalPercent: 100,
            steps: [
                { type: 'USER', userId: uid, required: false, autoApprove: false },
                { type: 'USER', userId: uid, required: false, autoApprove: false },
            ],
        });
        expect(result.success).toBe(false);
        expect(result.errors).toEqual(
            expect.arrayContaining([expect.stringContaining('Duplicate')])
        );
    });

    // ── All-required + low percentage ──────────────────────
    test('rejects all-required steps with minApprovalPercent < 100', () => {
        const result = validateApprovalFlow({
            name: 'Percentage Conflict',
            isManagerApprover: false,
            minApprovalPercent: 50,
            steps: [
                { type: 'USER', userId: '507f1f77bcf86cd799439011', required: true, autoApprove: false },
                { type: 'USER', userId: '507f1f77bcf86cd799439022', required: true, autoApprove: false },
            ],
        });
        expect(result.success).toBe(false);
        expect(result.errors).toEqual(
            expect.arrayContaining([expect.stringContaining('minApprovalPercent must be 100')])
        );
    });

    // ── Extra fields rejected (strict mode) ────────────────
    test('rejects extra/unknown fields in payload', () => {
        const result = validateApprovalFlow({
            name: 'Extra Fields',
            isManagerApprover: false,
            minApprovalPercent: 100,
            hackField: 'injected',
            steps: [
                { type: 'ROLE', role: 'ADMIN', required: false, autoApprove: false },
            ],
        });
        expect(result.success).toBe(false);
    });

    // ── Missing flow name ──────────────────────────────────
    test('rejects empty flow name', () => {
        const result = validateApprovalFlow({
            name: '',
            isManagerApprover: false,
            minApprovalPercent: 100,
            steps: [
                { type: 'ROLE', role: 'ADMIN', required: false, autoApprove: false },
            ],
        });
        expect(result.success).toBe(false);
        expect(result.errors).toEqual(
            expect.arrayContaining([expect.stringContaining('name')])
        );
    });

    // ── Percentage out of range ────────────────────────────
    test('rejects minApprovalPercent > 100', () => {
        const result = validateApprovalFlow({
            name: 'Over 100',
            isManagerApprover: false,
            minApprovalPercent: 150,
            steps: [
                { type: 'ROLE', role: 'ADMIN', required: false, autoApprove: false },
            ],
        });
        expect(result.success).toBe(false);
    });

    // ── Defaults correctly applied ─────────────────────────
    test('applies defaults (minApprovalPercent=100, isManagerApprover=true)', () => {
        const result = validateApprovalFlow({
            name: 'Defaults Test',
            steps: [
                { type: 'ROLE', role: 'MANAGER' },
            ],
        });
        expect(result.success).toBe(true);
        expect(result.data!.isManagerApprover).toBe(true);
        expect(result.data!.minApprovalPercent).toBe(100);
        expect(result.data!.steps[0].required).toBe(false);
        expect(result.data!.steps[0].autoApprove).toBe(false);
    });
});
