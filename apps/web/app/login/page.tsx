import type { Metadata } from "next";
import { Suspense } from "react";
import AuthForm from "@/components/AuthForm";
import Pic from "@/components/Pic";

export const metadata: Metadata = { title: "Sign in" };

export default function Page() {
  return (
    <div className="wrap grid min-h-[70vh] gap-12 py-12 lg:grid-cols-2 lg:py-20">
      <div className="relative hidden overflow-hidden bg-paper-deep lg:block">
        <Pic src="/products/aria-wireless-headphones-3.svg" alt="" sizes="50vw" className="object-cover" />
      </div>
      <div className="flex flex-col justify-center lg:max-w-md lg:pl-8">
        <p className="label">Sign in</p>
        <h1 className="display mb-10 mt-3 text-6xl leading-none">Welcome back.</h1>
        <Suspense fallback={null}>
          <AuthForm mode="login" />
        </Suspense>
      </div>
    </div>
  );
}
