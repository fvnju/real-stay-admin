"use client";

import { FormEvent, FormEventHandler, Fragment, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import * as motion from "motion/react-client";

import { safeReturn } from "@/utils/errorHandler";
import { loginSchema } from "@/utils/schema/auth";
import { InnerResponseType } from "@/app/api/auth/types";
import { POST } from "@/app/api/auth/login/route";
import { useTransitionRouter } from "next-view-transitions";

export default function SignInPage() {
  const router = useTransitionRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);

    const { data: parsedData, error } = await safeReturn(
      loginSchema.validate({
        email: formData.get("email"),
        password: formData.get("password"),
      })
    );
    if (error !== null) {
      toast.error(error.message);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const { data: res, error: resError } = await safeReturn(
      fetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(parsedData),
        headers: { "Content-Type": "application/json" },
      })
    );
    if (resError !== null) {
      setIsLoading(false);
      toast.error(`Client side: ${resError.message}`);
      return;
    }

    if (!res.ok) {
      setIsLoading(false);
      const resData = (await res.json()) as InnerResponseType<typeof POST>;
      if (resData.error) {
        if (typeof resData.error === "string") {
          toast.error(resData.error);
        } else {
          toast.error(resData.error.data.message);
        }
      }
      return;
    }

    router.replace("/dashboard");
  }

  return (
    <div className="flex max-h-[100dvh] overflow-hidden flex-col md:flex-row">
      {isLoading && <LoadingComp />}
      <div className="flex-1 relative h-full">
        <div className="absolute top-4 left-4 z-10 flex gap-0.5 items-center justify-center select-none">
          <Image
            className=""
            src={"/splash.svg"}
            alt="logo-white"
            width={28}
            height={28}
            draggable={false}
          />
          <span className="font-bold text-lg">Realstay</span>
        </div>
        <div className="absolute min-w-full min-h-screen sm:bg-gradient-to-b bg-black/[0.95] sm:from-black/10 sm:via-black/80 sm:to-black/90 z-[1] flex flex-col items-center justify-center">
          <section className="text-center max-w-[60%] mx-auto hidden md:block">
            <h2 className="text-3xl font-semibold shadow-xl tracking-tight font-sans">
              Build solutions so clear the future fixes itself.
            </h2>
            <p className="mt-2 text-sm text-white/60 italic">
              Tools that feel inevitable in hindsight yet impossible in
              foresight.
            </p>
          </section>

          <section className="flex md:hidden mx-[3%] flex-col gap-4 bg-[#111111] rounded-xl p-4 border-[#262626] border">
            <Form handleSubmit={handleSubmit} />
          </section>
        </div>
        <Image
          draggable={false}
          src={"/Pic.JPG"}
          alt="company image"
          width={960}
          height={1280}
          className="min-w-full min-h-screen object-cover"
        />
      </div>
      <div className="flex-1 hidden md:flex items-center justify-center">
        <section className="bg-white/[0.01] rounded-xl p-4 border-[#262626] border w-[50%] flex flex-col gap-4">
          <Form handleSubmit={handleSubmit} />
        </section>
      </div>
    </div>
  );
}

function Form({
  handleSubmit,
}: {
  handleSubmit: (e: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <Fragment>
      <h2 className="text-xl font-semibold text-center select-none">
        Welcome to Realstay Admin Panel
      </h2>
      <form onSubmit={handleSubmit} className="flex flex-col w-full mt-8">
        <label htmlFor="email" className="text-sm font-medium text-white/70">
          Email
        </label>
        <input
          className="mt-1 rounded-[0.625rem] text-sm px-4 h-10 w-full border border-[#262626] bg-transparent focus:outline-none focus:ring-0 focus:ring-offset-2"
          type="email"
          name="email"
          id="email"
          required
        />

        <label
          htmlFor="password"
          className="mt-4 text-sm font-medium text-white/70"
        >
          Password
        </label>
        <input
          className="mt-1 rounded-[0.625rem] text-sm px-4 h-10 w-full border border-[#262626] bg-transparent focus:outline-none focus:ring-0 focus:ring-offset-2"
          type="password"
          name="password"
          id="password"
          required
        />
        <a
          href=""
          className="self-end w-fit text-xs mt-4 text-right text-blue-500/70 focus:underline focus:outline-none focus:ring-0"
        >
          Forgot password?
        </a>

        <button
          type="submit"
          className="mt-8 bg-white text-black px-4 py-3 rounded-[0.625rem] text-sm font-medium hover:bg-white/80 focus:outline-none focus:ring-0 focus:ring-offset-2 focus:ring-offset-white/50"
        >
          Log in
        </button>
      </form>
    </Fragment>
  );
}

function LoadingComp() {
  return (
    <motion.div
      className="absolute bg-[#0F0F0F] z-50 w-screen h-[100dvh] flex flex-col items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      <div className="w-[200px]">
        <div className="relative space-y-5 overflow-hidden rounded-2xl bg-white/5 p-4 shadow-xl shadow-black/5 before:absolute before:inset-0 before:-translate-x-full before:-skew-x-12 before:animate-[shimmer_2s_infinite] before:border-t before:border-white/10 before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent">
          <div className="h-24 rounded-lg bg-white/5"></div>
          <div className="space-y-3">
            <div className="h-3 w-3/5 rounded-lg bg-white/5"></div>
            <div className="h-3 w-4/5 rounded-lg bg-white/10"></div>
            <div className="h-3 w-2/5 rounded-lg bg-white/5"></div>
          </div>
        </div>
      </div>

      <section className="w-10/12 md:w-1/2 text-center mt-8">
        <h3 className="text-2xl font-semibold tracking-tight">
          Please wait while we&apos;re logging you in
        </h3>
        <p className="mt-2 leading-7">
          We&apos;re setting up everything you need. This won&apos;t take long,
          and you&apos;ll have access in no time!
        </p>
      </section>
    </motion.div>
  );
}
