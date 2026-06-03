import type { NextConfig } from "next"

const enableFetchFullUrlLogging =
  process.env.NEXT_DEBUG_FETCH_FULL_URL === "1" ||
  process.env.NEXT_DEBUG_FETCH_FULL_URL === "true"

const nextConfig: NextConfig = {
  trailingSlash: false,
  reactStrictMode: true,
  experimental: {
    serverActions: {
      bodySizeLimit: "5mb",
    },
  },
  ...(enableFetchFullUrlLogging
    ? {
        logging: {
          fetches: {
            fullUrl: true,
          },
        },
      }
    : {}),
  images: {
    remotePatterns: [
      {
        hostname: "github.com",
      },
      {
        protocol: "https",
        hostname: "example.com",
      },
      {
        protocol: "https",
        hostname: "medusa-public-images.s3.eu-west-1.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "mercur-connect.s3.eu-central-1.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "api.mercurjs.com",
      },
      {
        protocol: "http",
        hostname: "localhost",
      },
      {
        protocol: "https",
        hostname: "api-sandbox.mercurjs.com",
        pathname: "/static/**",
      },
      {
        protocol: "https",
        hostname: "i.imgur.com",
      },
      {
        protocol: "https",
        hostname: "s3.eu-central-1.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "**.r2.dev",
      },
      {
        protocol: "https",
        hostname: "r2.sopet.org",
      },
      {
        protocol: "https",
        hostname: "sopet.org",
      },
      {
        protocol: "https",
        hostname: "api.omise.co",
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/store/:path*",
        destination: `${process.env.MEDUSA_BACKEND_URL}/store/:path*`,
      },
    ]
  },
}

module.exports = nextConfig
