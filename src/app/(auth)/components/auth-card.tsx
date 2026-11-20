"use client";

import { Card } from "@heroui/react";
import Image from "next/image";
import type { ReactNode } from "react";
import { ThemeSwitcher } from "@/components/theme-switcher";

/**
 * The frame of the sign-in, invite and password pages: the logo, a title, a
 * short text, and the form in a card in the middle of the page.
 */
export function AuthCard({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description?: ReactNode;
  children: ReactNode;
  /** Under the card, for example a link to another auth page. */
  footer?: ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="flex items-center justify-between px-4 py-4 sm:px-6">
        <div className="flex items-center gap-2 select-none">
          <Image
            src="/edge-tech-logo.svg"
            alt=""
            width={28}
            height={28}
            className="rounded-lg"
            style={{ borderCurve: "continuous" } as React.CSSProperties}
          />
          <span className="text-sm font-semibold">RealStay Admin</span>
        </div>
        <ThemeSwitcher surface="background" />
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="flex w-full max-w-[400px] flex-col gap-6">
          <Card className="gap-6 p-6 sm:p-8">
            <Card.Header className="gap-1.5">
              <Card.Title className="text-xl font-semibold tracking-tight">
                {title}
              </Card.Title>
              {description ? (
                <Card.Description className="text-sm text-muted">
                  {description}
                </Card.Description>
              ) : null}
            </Card.Header>
            <Card.Content>{children}</Card.Content>
          </Card>
          {footer ? (
            <div className="text-center text-sm text-muted">{footer}</div>
          ) : null}
        </div>
      </main>

      <footer className="pb-6 text-center text-xs text-muted">
        © {new Date().getFullYear()} RealStay
      </footer>
    </div>
  );
}
