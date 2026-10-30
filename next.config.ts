import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.18.108"],
  experimental: {
    // ponytail: Next 16.3 rejects late debug frames after close; re-enable after upstream fix.
    reactDebugChannel: false,
  },
  logging: {
    serverFunctions: false,
    incomingRequests: false,
  },
};

export default nextConfig;
