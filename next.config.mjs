/** @type {import('next').NextConfig} */

const isVercel = Boolean(process.env.VERCEL);

const backendOrigin = (
    process.env.BACKEND_PROXY_TARGET ||
    process.env.NEXT_PUBLIC_PRODUCTION_API_URL ||
    (isVercel ? "https://storvia-backend.vercel.app" : "http://127.0.0.1:5000")
)
    .replace(/\/+$/, "")
    .replace(/\/api$/, "");

const nextConfig = {
    productionBrowserSourceMaps: false,
    async rewrites() {
        return [
            {
                source: "/api/:path*",
                destination: `${backendOrigin}/api/:path*`,
            },
        ];
    },
};

export default nextConfig;
