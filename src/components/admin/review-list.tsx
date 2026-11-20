"use client";

import { Card, Skeleton } from "@heroui/react";
import type { Review } from "@/app/endpoints/reviews/reviews-types";
import { Icon } from "@/components/icon";
import { formatDate } from "./format";
import { UserCell } from "./user-cell";

function Stars({ score }: { score: number }) {
  const rounded = Math.round(score * 2) / 2;
  return (
    <span className="flex items-center gap-0.5 text-warning" aria-label={`${score} of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Icon
          key={i}
          size={14}
          name={i + 1 <= rounded ? "star" : i + 0.5 === rounded ? "star-half" : "star-outline"}
        />
      ))}
    </span>
  );
}

/** Reviews with the reviewer, the stars, the date and the text. */
export function ReviewList({
  title = "Reviews",
  reviews,
  total,
  isLoading = false,
}: {
  title?: string;
  reviews: Review[];
  /** All reviews, when the list shows only some of them. */
  total?: number;
  isLoading?: boolean;
}) {
  return (
    <Card className="gap-4 p-5">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-base font-semibold">{title}</h2>
        {total ? <span className="text-sm text-muted tabular-nums">{total} in total</span> : null}
      </div>
      {isLoading ? (
        <div className="flex flex-col gap-4">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-10 text-muted">
          <Icon name="star-outline" size={32} />
          <p className="text-sm">No reviews yet.</p>
        </div>
      ) : (
        <ul className="flex flex-col divide-y divide-separator">
          {reviews.map((review) => (
            <li key={review._id} className="flex flex-col gap-2 py-4 first:pt-0 last:pb-0">
              <div className="flex items-center justify-between gap-3">
                <UserCell user={review.reviewer} secondary={review.reviewer?.email} />
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <Stars score={review.rating_score} />
                  <span className="text-xs text-muted">{formatDate(review.createdAt)}</span>
                </div>
              </div>
              {review.comment ? <p className="text-sm">{review.comment}</p> : null}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
