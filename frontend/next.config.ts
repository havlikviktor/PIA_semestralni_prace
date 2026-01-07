import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');
const isProd = process.env.IS_PROD === 'true';

const nextConfig: NextConfig = {
  output: isProd ? 'standalone' : undefined,
  reactStrictMode: true,
  experimental: {
    // @ts-ignore
    allowedDevOrigins: [`http://${process.env.NEXT_PUBLIC_SERVER_IP}:${process.env.BACKEND_PORT}`],
  },
};

export default withNextIntl(nextConfig);
