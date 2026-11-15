"use client";

import { ThumbsUp } from "lucide-react";
import { useState, useTransition } from "react";

import { toggleUpvote } from "@/app/submissions/actions";

import { Button } from "./ui";

export function UpvoteButton({ id, initialCount, initialUpvoted, label }: { id: string; initialCount: number; initialUpvoted: boolean; label: string }) {
  const [count, setCount] = useState(initialCount);
  const [upvoted, setUpvoted] = useState(initialUpvoted);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <div className="flex items-center gap-2">
      <Button
        variant={upvoted ? "primary" : "outline"}
        size="sm"
        disabled={pending}
        aria-pressed={upvoted}
        onClick={() =>
          start(async () => {
            const res = await toggleUpvote(id);
            if ("error" in res) setError(res.error);
            else {
              setError(null);
              setUpvoted(res.upvoted);
              setCount(res.count);
            }
          })
        }
      >
        <ThumbsUp /> {label} · {count}
      </Button>
      {error && <span className="text-xs text-danger">{error}</span>}
    </div>
  );
}
