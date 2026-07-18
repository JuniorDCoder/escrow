"use client";

import { useRef, useState, useTransition } from "react";
import { Info } from "lucide-react";
import { postMessageAction } from "@/lib/actions/transactions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn, formatDate } from "@/lib/utils";
import type { Message } from "@/lib/types/database";

interface MessageThreadProps {
  transactionId: string;
  messages: Message[];
  currentUserId: string;
  disabled?: boolean;
}

function initials(id: string) {
  return id.slice(0, 2).toUpperCase();
}

export function MessageThread({ transactionId, messages, currentUserId, disabled }: MessageThreadProps) {
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    setError(null);
    startTransition(async () => {
      const result = await postMessageAction({ transactionId, body });
      if (result.error) {
        setError(result.error);
        return;
      }
      setBody("");
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        {messages.length === 0 && <p className="text-sm text-muted-foreground">No activity yet.</p>}
        {messages.map((m) =>
          m.is_system_event ? (
            <div key={m.id} className="flex items-start gap-2 text-xs text-muted-foreground">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <p>
                {m.body} <span className="opacity-70">· {formatDate(m.created_at)}</span>
              </p>
            </div>
          ) : (
            <div key={m.id} className={cn("flex gap-2", m.sender_id === currentUserId && "flex-row-reverse")}>
              <Avatar className="h-7 w-7 shrink-0">
                <AvatarFallback className="text-[10px]">{m.sender_id ? initials(m.sender_id) : "SP"}</AvatarFallback>
              </Avatar>
              <div
                className={cn(
                  "max-w-[80%] rounded-lg px-3 py-2 text-sm",
                  m.sender_id === currentUserId ? "bg-primary text-primary-foreground" : "bg-secondary"
                )}
              >
                <p className="whitespace-pre-wrap">{m.body}</p>
                <p className={cn("mt-1 text-[10px] opacity-70")}>{formatDate(m.created_at)}</p>
              </div>
            </div>
          )
        )}
      </div>

      {!disabled && (
        <form ref={formRef} onSubmit={onSubmit} className="flex items-end gap-2 border-t border-border pt-4">
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Message the other party or admin…"
            rows={2}
            className="flex-1"
          />
          <Button type="submit" disabled={isPending || !body.trim()}>
            Send
          </Button>
        </form>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
