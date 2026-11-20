"use client";

import { Button, Modal } from "@heroui/react";
import { useEffect, useState } from "react";
import { Icon } from "@/components/icon";

/** Photo thumbnails. A click opens a large view with previous and next. */
export function PhotoGallery({ photos, title }: { photos: string[]; title: string }) {
  const [open, setOpen] = useState<number | null>(null);
  const count = photos.length;

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") setOpen((i) => (i === null ? i : (i + 1) % count));
      if (e.key === "ArrowLeft") setOpen((i) => (i === null ? i : (i - 1 + count) % count));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, count]);

  if (!count) {
    return (
      <div className="flex h-40 flex-col items-center justify-center gap-2 rounded-2xl bg-default text-muted">
        <Icon name="images-outline" size={28} />
        <p className="text-sm">No photos.</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-2 smallPhone:grid-cols-3 md:grid-cols-4">
        {photos.map((src, i) => (
          <button
            key={src + i}
            type="button"
            onClick={() => setOpen(i)}
            className="group relative aspect-[4/3] overflow-hidden rounded-xl bg-default outline-none focus-visible:ring-2 focus-visible:ring-focus"
            aria-label={`Open photo ${i + 1} of ${count}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- photos come from many hosts */}
            <img src={src} alt="" loading="lazy" className="size-full object-cover transition-opacity group-hover:opacity-90" />
          </button>
        ))}
      </div>

      <Modal.Backdrop isOpen={open !== null} onOpenChange={(o) => !o && setOpen(null)}>
        <Modal.Container size="lg">
          <Modal.Dialog className="gap-3">
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading className="truncate pr-8">{title}</Modal.Heading>
              <p className="text-sm text-muted tabular-nums">
                {(open ?? 0) + 1} of {count}
              </p>
            </Modal.Header>
            <Modal.Body className="relative p-0">
              {open !== null ? (
                // eslint-disable-next-line @next/next/no-img-element -- photos come from many hosts
                <img src={photos[open]} alt={`Photo ${open + 1} of ${title}`} className="max-h-[70vh] w-full rounded-2xl object-contain" />
              ) : null}
            </Modal.Body>
            {count > 1 ? (
              <Modal.Footer className="justify-between">
                <Button variant="secondary" size="sm" onPress={() => setOpen((i) => ((i ?? 0) - 1 + count) % count)}>
                  <Icon name="chevron-back" size={16} />
                  Previous
                </Button>
                <Button variant="secondary" size="sm" onPress={() => setOpen((i) => ((i ?? 0) + 1) % count)}>
                  Next
                  <Icon name="chevron-forward" size={16} />
                </Button>
              </Modal.Footer>
            ) : null}
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </>
  );
}
