import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import path from "path";
import dotenv from "dotenv";
import fs from "fs";

const parentEnvPath = path.resolve(__dirname, "../.env");
if (fs.existsSync(parentEnvPath)) {
  dotenv.config({ path: parentEnvPath, override: true });
}

const dockerEnvPath = "/project_root/.env";
if (fs.existsSync(dockerEnvPath)) {
  dotenv.config({ path: dockerEnvPath, override: true });
}

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    // @ts-ignore
    allowedDevOrigins: [`http://${process.env.NEXT_PUBLIC_SERVER_IP}`],
  },
};

export default withNextIntl(nextConfig);
