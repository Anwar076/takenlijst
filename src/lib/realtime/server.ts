import Pusher from "pusher";
import { isServerRealtimeEnabled, serverEnv } from "@/lib/env";

let serverInstance: Pusher | null = null;

export function getPusherServer() {
  if (!isServerRealtimeEnabled()) {
    return null;
  }

  if (!serverInstance) {
    serverInstance = new Pusher({
      appId: serverEnv.pusherAppId!,
      key: serverEnv.pusherKey!,
      secret: serverEnv.pusherSecret!,
      cluster: serverEnv.pusherCluster!,
      useTLS: true,
    });
  }

  return serverInstance;
}

export async function triggerRealtimeEvent(channel: string, event: string, payload: unknown) {
  const instance = getPusherServer();
  if (!instance) {
    return;
  }
  await instance.trigger(channel, event, payload);
}
