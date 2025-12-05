"use client";

import PusherClient from "pusher-js";
import { publicEnv, isBrowserRealtimeEnabled } from "@/lib/env";

let client: PusherClient | null = null;

export function getPusherClient() {
  if (!isBrowserRealtimeEnabled()) {
    return null;
  }

  if (!client) {
    client = new PusherClient(publicEnv.pusherKey!, {
      cluster: publicEnv.pusherCluster!,
    });
  }

  return client;
}
