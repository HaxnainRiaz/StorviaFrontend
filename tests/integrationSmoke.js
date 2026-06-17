const baseUrl = (process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:5000').replace(/\/+$/, '').replace(/\/api$/, '');
const apiBase = `${baseUrl}/api`;
const token = process.env.TEST_AUTH_TOKEN || '';
const storeSlug = process.env.TEST_STORE_SLUG || '';

const requiredSellerEndpoints = [
    '/seller/dashboard/stats',
    '/seller/store/setup-status',
    '/seller/storefront/overview',
    '/seller/storefront/theme',
    '/seller/products',
    '/seller/orders',
    '/seller/categories',
    '/seller/coupons',
    '/seller/shipping/settings',
    '/seller/payments/settings',
];

async function request(path, options = {}) {
    const started = Date.now();
    try {
        const response = await fetch(`${apiBase}${path}`, {
            ...options,
            headers: {
                ...(options.body ? { 'Content-Type': 'application/json' } : {}),
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
                ...(options.headers || {}),
            },
        });
        const contentType = response.headers.get('content-type') || '';
        const payload = contentType.includes('application/json') ? await response.json() : await response.text();
        return { path, status: response.status, ok: response.ok, ms: Date.now() - started, payload };
    } catch (error) {
        return { path, status: 0, ok: false, ms: Date.now() - started, error: error.message };
    }
}

function printResult(label, result, acceptedStatuses = [200]) {
    const accepted = acceptedStatuses.includes(result.status);
    const status = accepted ? 'PASS' : 'FAIL';
    const message = result.payload?.message || result.error || '';
    console.log(`${status} ${label}: ${result.status} ${result.ms}ms ${message}`);
    return accepted;
}

(async () => {
    console.log(`Storvia integration smoke test`);
    console.log(`API base: ${apiBase}`);

    let failures = 0;

    const unauthorizedMe = await request('/auth/me');
    if (!printResult('unauthenticated /auth/me is protected', unauthorizedMe, token ? [200] : [401])) failures++;

    const loginValidation = await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: '', password: '' }),
    });
    if (!printResult('login validation reaches backend', loginValidation, [400])) failures++;

    if (token) {
        const me = await request('/auth/me');
        if (!printResult('authenticated /auth/me', me, [200])) failures++;

        for (const endpoint of requiredSellerEndpoints) {
            const result = await request(endpoint);
            if (!printResult(`seller ${endpoint}`, result, [200, 403])) failures++;
        }
    } else {
        console.log('SKIP authenticated seller endpoint probes - set TEST_AUTH_TOKEN to enable');
    }

    if (storeSlug) {
        const storefront = await request(`/storefront/${storeSlug}`);
        if (!printResult('public storefront by slug', storefront, [200, 403, 404])) failures++;

        const products = await request(`/storefront/${storeSlug}/products`);
        if (!printResult('public storefront products by slug', products, [200, 403, 404])) failures++;
    } else {
        console.log('SKIP public storefront slug probes - set TEST_STORE_SLUG to enable');
    }

    console.log(`\nIntegration smoke summary: ${failures ? 'FAILED' : 'PASSED'} (${failures} failures)`);
    process.exit(failures ? 1 : 0);
})();
