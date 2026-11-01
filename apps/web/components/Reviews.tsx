"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import Stars from "./Stars";

interface Review {
  _id: string;
  rating: number;
  comment: string;
  createdAt: string;
  userId?: { name?: string } | string;
}

const isMongoId = (s: string) => /^[a-f0-9]{24}$/i.test(s);

export default function Reviews({ productId }: { productId: string }) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[] | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const live = isMongoId(productId);

  const load = useCallback(async () => {
    if (!live) return setReviews([]);
    try {
      setReviews(await api<Review[]>(`/products/${productId}/reviews`));
    } catch {
      setReviews([]);
    }
  }, [productId, live]);

  useEffect(() => {
    load();
  }, [load]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api(`/products/${productId}/reviews`, { method: "POST", body: JSON.stringify({ rating, comment }) });
      setComment("");
      await load();
    } catch (err: any) {
      setError(err.code === "NOT_PURCHASED" ? "Only customers who bought this can review it." : err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="grid gap-12 lg:grid-cols-12" aria-labelledby="reviews-h">
      <h2 id="reviews-h" className="display text-4xl lg:col-span-4">
        Reviews
      </h2>
      <div className="lg:col-span-8">
        {reviews === null ? (
          <p className="text-ink-mute">Loading…</p>
        ) : reviews.length === 0 ? (
          <p className="text-ink-soft">No reviews yet.</p>
        ) : (
          <ul className="divide-y divide-ink/15 border-y border-ink/15">
            {reviews.map((r) => (
              <li key={r._id} className="py-6">
                <div className="flex items-center justify-between gap-4">
                  <Stars value={r.rating} />
                  <span className="label">
                    {typeof r.userId === "object" && r.userId?.name ? r.userId.name : "Customer"} ·{" "}
                    {new Date(r.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                  </span>
                </div>
                <p className="mt-3 max-w-2xl text-ink-soft">{r.comment}</p>
              </li>
            ))}
          </ul>
        )}

        {live &&
          (user ? (
            <form onSubmit={submit} className="mt-10 grid gap-5">
              <p className="label">Write a review</p>
              <div>
                <label htmlFor="rating" className="label">
                  Rating
                </label>
                <select id="rating" value={rating} onChange={(e) => setRating(Number(e.target.value))} className="field">
                  {[5, 4, 3, 2, 1].map((n) => (
                    <option key={n} value={n}>
                      {n} — {["", "Poor", "Fair", "Good", "Very good", "Excellent"][n]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="comment" className="label">
                  Your thoughts
                </label>
                <textarea
                  id="comment"
                  required
                  rows={3}
                  maxLength={2000}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="field resize-none"
                />
              </div>
              {error && (
                <p role="alert" className="text-sm text-clay">
                  {error}
                </p>
              )}
              <button type="submit" disabled={busy} className="btn w-fit">
                {busy ? "Posting…" : "Post review"}
              </button>
            </form>
          ) : (
            <p className="mt-8 text-sm text-ink-soft">
              <Link href="/login" className="link-u text-ink">
                Sign in
              </Link>{" "}
              to review products you&apos;ve bought.
            </p>
          ))}
      </div>
    </section>
  );
}
