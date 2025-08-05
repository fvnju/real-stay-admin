"use client";

import ViewTransitionsP from "./ViewTransitionsP";

export default function ViewTransitionsA() {
  if (!document.startViewTransition) {
    return <ViewTransitionsP />;
  }
}
