"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getPusherClient } from "@/lib/realtime/client";

export function TaskListsRealtimeBridge({ companyId }: { companyId: string }) {
  const router = useRouter();

  useEffect(() => {
    const client = getPusherClient();
    if (!client) {
      return undefined;
    }

    const channelName = `taskflow-company-${companyId}-lists`;
    const channel = client.subscribe(channelName);
    const refresh = () => router.refresh();

    channel.bind("task-lists:refresh", refresh);

    return () => {
      channel.unbind("task-lists:refresh", refresh);
      client.unsubscribe(channelName);
    };
  }, [companyId, router]);

  return null;
}
