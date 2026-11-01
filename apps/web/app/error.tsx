"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="wrap flex min-h-[60vh] flex-col items-start justify-center gap-8 py-24">
      <p className="label">Something broke</p>
      <h1 className="display text-6xl leading-none sm:text-8xl">Please try that again.</h1>
      <button type="button" onClick={reset} className="btn">
        Retry
      </button>
    </div>
  );
}
