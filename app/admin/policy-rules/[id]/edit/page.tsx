'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import PolicyRuleForm from '@/components/admin/PolicyRuleForm';

export default function EditPolicyRulePage() {
  const params = useParams();
  const id = params.id as string;
  const [rule, setRule] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/admin/policy-rules/${id}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) throw new Error(d.error);
        setRule(d.rule);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex items-center gap-3 text-muted-foreground">
          <div className="h-5 w-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">Loading rule…</span>
        </div>
      </div>
    );
  }

  if (error || !rule) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-sm text-destructive">
        <p>{error || 'Rule not found'}</p>
      </div>
    );
  }

  return <PolicyRuleForm mode="edit" initialData={rule} ruleId={id} />;
}
