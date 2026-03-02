// ─────────────────────────────────────────────────────
// @termuijs/data — HTTP health check / ping via fetch
// ─────────────────────────────────────────────────────

export interface HealthResult {
    name: string;
    url: string;
    status: 'up' | 'down';
    latency: number;   // ms
    statusCode: number;
}

export interface Endpoint {
    name: string;
    url: string;
}

const _latencyHistory = new Map<string, number[]>();
const MAX_HISTORY = 60;

/** HTTP data provider — uses native fetch (Node 18+) */
export const http = {
    /**
     * Ping a URL and return health status + latency.
     */
    async ping(url: string): Promise<HealthResult> {
        const start = Date.now();
        try {
            const res = await fetch(url, {
                method: 'GET',
                signal: AbortSignal.timeout(5000),
            });
            const latency = Date.now() - start;

            // Store latency history
            if (!_latencyHistory.has(url)) _latencyHistory.set(url, []);
            const history = _latencyHistory.get(url)!;
            history.push(latency);
            if (history.length > MAX_HISTORY) history.shift();

            return {
                name: url,
                url,
                status: res.ok ? 'up' : 'down',
                latency,
                statusCode: res.status,
            };
        } catch {
            const latency = Date.now() - start;
            return { name: url, url, status: 'down', latency, statusCode: 0 };
        }
    },

    /**
     * Get rolling latency history for a URL (for sparklines).
     */
    latency(url: string): number[] {
        return _latencyHistory.get(url) ?? [];
    },

    /**
     * Check multiple endpoints and return results for a table.
     */
    async checkAll(endpoints: Endpoint[]): Promise<HealthResult[]> {
        const results = await Promise.all(
            endpoints.map(async (ep) => {
                const result = await http.ping(ep.url);
                result.name = ep.name;
                return result;
            }),
        );
        return results;
    },
};
