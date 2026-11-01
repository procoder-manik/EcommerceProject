"use client";

import { useState } from "react";
import { ArrowRight } from "./icons";

export default function NewsletterForm() {
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <p className="display text-2xl text-paper" role="status">
        Thank you. Your first note arrives soon.
      </p>
    );
  }

  return (
    <form
      className="flex w-full max-w-lg items-end gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        setDone(true);
      }}
    >
      <div className="flex-1">
        <label htmlFor="newsletter-email" className="label !text-paper/60">
          Email address
        </label>
        <input
          id="newsletter-email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          className="field !border-paper/40 !text-paper placeholder:!text-paper/40 focus:!border-paper"
        />
      </div>
      <button
        type="submit"
        aria-label="Subscribe"
        className="mb-1 flex h-12 w-12 flex-none cursor-pointer items-center justify-center rounded-full bg-paper text-ink transition-colors duration-300 hover:bg-clay hover:text-paper"
      >
        <ArrowRight width={20} height={20} />
      </button>
    </form>
  );
}
