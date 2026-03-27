'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, Circle, Clock, XCircle, User as UserIcon, Shield } from 'lucide-react';

interface ChainStep {
    stepIndex: number;
    approverId?: string;
    role?: string;
    required?: boolean;
    autoApprove?: boolean;
    label?: string;
}

interface Action {
    stepIndex: number;
    action: string;
    comment: string;
    approverId: {
        name: string;
        image?: string;
    };
    createdAt: string;
}

export function ApprovalChainStepper({ expenseId, currentStepIndex, status }: { expenseId: string, currentStepIndex: number, status: string }) {
    const [chain, setChain] = useState<ChainStep[]>([]);
    const [actions, setActions] = useState<Action[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                const [chainRes, actionsRes] = await Promise.all([
                    fetch(`/api/expenses/${expenseId}/chain`),
                    fetch(`/api/expenses/${expenseId}/actions`)
                ]);
                const chainData = await chainRes.json();
                const actionsData = await actionsRes.json();
                
                // Security: Ensure we always have arrays
                setChain(Array.isArray(chainData) ? chainData : []);
                setActions(Array.isArray(actionsData) ? actionsData : []);
            } catch (e) {
                console.error('Failed to load stepper data', e);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [expenseId]);

    if (loading) return <div className="animate-pulse h-20 bg-gray-100 rounded-lg"></div>;
    if (chain.length === 0) return null;

    return (
        <div className="space-y-6">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Approval Journey</h3>
            <div className="relative pl-8 space-y-8 before:absolute before:inset-0 before:left-[11px] before:w-0.5 before:bg-gray-200">
                {chain.map((step, i) => {
                    const action = actions.find(a => a.stepIndex === step.stepIndex);
                    const isCompleted = i < currentStepIndex || (status === 'APPROVED' && i === chain.length - 1);
                    const isCurrent = i === currentStepIndex && status === 'PENDING';
                    const isRejected = status === 'REJECTED' && i === currentStepIndex;

                    return (
                        <div key={i} className="relative">
                            <span className="absolute -left-[27px] mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-white ring-2 ring-gray-200">
                                {isCompleted ? <CheckCircle2 className="h-4 w-4 text-green-500 fill-green-50" /> :
                                 isRejected ? <XCircle className="h-4 w-4 text-red-500 fill-red-50" /> :
                                 isCurrent ? <Clock className="h-4 w-4 text-blue-500 animate-pulse" /> :
                                 <Circle className="h-4 w-4 text-gray-300" />}
                            </span>

                            <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                    <span className={`text-sm font-medium ${isCurrent ? 'text-blue-700' : 'text-gray-900'}`}>
                                        {step.label}
                                    </span>
                                    {step.role && (
                                        <span className="px-1.5 py-0.5 rounded bg-gray-100 text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1">
                                            <Shield className="h-2.5 w-2.5" />
                                            {step.role}
                                        </span>
                                    )}
                                </div>

                                {action && (
                                    <div className="mt-1 p-2 rounded-lg bg-gray-50 border border-gray-100">
                                        <div className="flex items-center gap-2 mb-1">
                                            {action.approverId.image ? (
                                                <img src={action.approverId.image} className="h-4 w-4 rounded-full" />
                                            ) : (
                                                <UserIcon className="h-3 w-3 text-gray-400" />
                                            )}
                                            <span className="text-[11px] font-semibold text-gray-600">{action.approverId.name}</span>
                                            <span className="text-[10px] text-gray-400">{new Date(action.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        {action.comment && (
                                            <p className="text-[11px] text-gray-500 italic">"{action.comment}"</p>
                                        )}
                                    </div>
                                )}

                                {!action && isCurrent && (
                                    <p className="text-[11px] text-blue-500 italic">Awaiting action...</p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
