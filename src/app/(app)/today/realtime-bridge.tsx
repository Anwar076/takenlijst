"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getPusherClient } from "@/lib/realtime/client";

export function TodayRealtimeBridge({ companyId, date }: { companyId: string; date: string }) {
  const router = useRouter();

  useEffect(() => {
    const client = getPusherClient();
    if (!client) {
      return undefined;
    }

    const channelName = `taskflow-company-${companyId}-day-${date}`;
    const channel = client.subscribe(channelName);
    const refresh = () => router.refresh();

    channel.bind("task-instance:refresh", refresh);
    channel.bind("manager-note:update", refresh);

    return () => {
      channel.unbind("task-instance:refresh", refresh);
      channel.unbind("manager-note:update", refresh);
      client.unsubscribe(channelName);
    };
  }, [companyId, date, router]);

  return null;
}
