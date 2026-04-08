import { Suspense } from 'react';
import { GoogleCompleteForm } from './google-complete-form';

function GoogleCompleteFallback() {
  return (
    <div className="min-h-screen bg-[#0B0F1A] text-white flex items-center justify-center p-6">
      <div className="flex flex-col items-center gap-3">
        <span
          className="h-8 w-8 border-2 border-white/20 border-t-primary rounded-full animate-spin"
          aria-hidden
        />
        <p className="text-sm text-white/50">Loading…</p>
      </div>
    </div>
  );
}

export default function GoogleCompleteSignupPage() {
  return (
    <Suspense fallback={<GoogleCompleteFallback />}>
      <GoogleCompleteForm />
    </Suspense>
  );
}
