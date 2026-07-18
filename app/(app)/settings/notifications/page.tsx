import type { Metadata } from "next";
import Link from "next/link";
import { getAllNotifications } from "@/lib/data/notifications";
import { getNotificationCopy } from "@/lib/domain/notifications";
import { MarkAllReadButton } from "@/components/settings/mark-all-read-button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { Bell } from "lucide-react";

export const metadata: Metadata = { title: "Notifications" };

export default async function NotificationsSettingsPage() {
  const notifications = await getAllNotifications();
  const hasUnread = notifications.some((n) => !n.read_at);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{notifications.length} total</p>
        {hasUnread && <MarkAllReadButton />}
      </div>

      {notifications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-16 text-center text-muted-foreground">
            <Bell className="h-8 w-8" />
            <p>No notifications yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="divide-y divide-border rounded-md border border-border bg-card">
          {notifications.map((n) => {
            const { text, href } = getNotificationCopy(n);
            const row = (
              <div className={`flex items-center justify-between gap-4 px-4 py-3 text-sm ${!n.read_at ? "bg-secondary/40" : ""}`}>
                <span>{text}</span>
                <span className="shrink-0 text-xs text-muted-foreground">{formatDate(n.created_at)}</span>
              </div>
            );
            return href ? (
              <Link key={n.id} href={href} className="block hover:bg-secondary/60">
                {row}
              </Link>
            ) : (
              <div key={n.id}>{row}</div>
            );
          })}
        </div>
      )}
    </div>
  );
}
