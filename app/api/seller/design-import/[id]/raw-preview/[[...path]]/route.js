import { cookies } from "next/headers";

const getBackendApiUrl = () => {
    const base = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/+$/, "");
    return base.endsWith("/api") ? base : `${base}/api`;
};

export async function GET(request, { params }) {
    const { id, path = [] } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return new Response("Unauthorized", { status: 401 });

    const suffix = path.length ? `/${path.map(encodeURIComponent).join("/")}` : "/index.html";
    const response = await fetch(`${getBackendApiUrl()}/seller/design-import/${encodeURIComponent(id)}/raw-preview${suffix}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
    });
    const headers = new Headers();
    const contentType = response.headers.get("content-type");
    if (contentType) headers.set("content-type", contentType);
    headers.set("cache-control", "no-store");
    headers.set("content-security-policy", "default-src 'self' data: blob:; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; font-src 'self' data:; script-src 'none'; frame-src 'none'; object-src 'none'");
    return new Response(response.body, { status: response.status, headers });
}
