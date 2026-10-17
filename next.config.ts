import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  logging: {
    serverFunctions: false,
    incomingRequests: false,
  },
};

export default nextConfig;
