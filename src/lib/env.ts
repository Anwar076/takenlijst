type EnvValue = string | undefined;

function readEnv(name: string): EnvValue {
  return process.env[name];
}

export const serverEnv = {
  pusherAppId: readEnv("PUSHER_APP_ID"),
  pusherKey: readEnv("PUSHER_KEY"),
  pusherSecret: readEnv("PUSHER_SECRET"),
  pusherCluster: readEnv("PUSHER_CLUSTER"),
};

export const publicEnv = {
  pusherKey: readEnv("NEXT_PUBLIC_PUSHER_KEY"),
  pusherCluster: readEnv("NEXT_PUBLIC_PUSHER_CLUSTER"),
};

export function isServerRealtimeEnabled() {
  return Boolean(
    serverEnv.pusherAppId && serverEnv.pusherKey && serverEnv.pusherSecret && serverEnv.pusherCluster,
  );
}

export function isBrowserRealtimeEnabled() {
  return Boolean(publicEnv.pusherKey && publicEnv.pusherCluster);
}
