"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { markNotificationReadAction } from "@/lib/actions/notifications";
import { getNotificationCopy } from "@/lib/domain/notifications";
import { timeAgo } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Notification } from "@/lib/types/database";

export function NotificationBell({ notifications, unreadCount }: { notifications: Notification[]; unreadCount: number }) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const handleClick = (n: Notification) => {
    if (!n.read_at) {
      startTransition(async () => {
        await markNotificationReadAction(n.id);
        router.refresh();
      });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-medium text-destructive-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          Notifications
          <Link href="/settings/notifications" className="text-xs font-normal text-primary hover:underline">
            View all
          </Link>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.length === 0 && <p className="px-2 py-4 text-center text-sm text-muted-foreground">You&apos;re all caught up.</p>}
        <div className="max-h-80 overflow-y-auto">
          {notifications.map((n) => {
            const { text, href } = getNotificationCopy(n);
            const content = (
              <div className={`flex flex-col gap-0.5 rounded-sm px-2 py-2 text-sm hover:bg-secondary ${!n.read_at ? "bg-secondary/50" : ""}`}>
                <p className="line-clamp-2">{text}</p>
                <span className="text-xs text-muted-foreground">{timeAgo(n.created_at)}</span>
              </div>
            );
            return href ? (
              <Link key={n.id} href={href} onClick={() => handleClick(n)}>
                {content}
              </Link>
            ) : (
              <div key={n.id} onClick={() => handleClick(n)} className="cursor-pointer">
                {content}
              </div>
            );
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
