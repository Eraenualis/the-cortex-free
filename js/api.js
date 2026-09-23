// js/api.js — VORTEX API client (via CORS proxy, with 30-min cache)

class VortexAPI {
    constructor(proxyUrl = 'https://the-cortex-free-proxy.eraenualis.workers.dev') {
        this.proxyUrl = proxyUrl;
        this.cacheTtl = 24 * 60 * 60 * 1000; // 24 hours — leaderboard changes every 47-72h
    }

    getCache(key) {
        try {
            const cached = localStorage.getItem(key);
            if (!cached) return null;
            const { timestamp, data } = JSON.parse(cached);
            if (Date.now() - timestamp > this.cacheTtl) {
                localStorage.removeItem(key);
                return null;
            }
            return data;
        } catch (e) {
            return null;
        }
    }

    setCache(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify({ timestamp: Date.now(), data }));
        } catch (e) {
            // storage full
        }
    }

    async request(path, apiKey = null, useCache = true) {
        const url = `${this.proxyUrl}/vortex${path}`;
        const cacheKey = `cortex_${path}`;
        
        if (useCache && !apiKey) {
            const cached = this.getCache(cacheKey);
            if (cached) return cached;
        }
        
        const headers = { 'Accept': 'application/json' };
        if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

        const response = await fetch(url, { headers });
        const data = await response.json();
        
        if (useCache && !apiKey) this.setCache(cacheKey, data);
        return data;
    }

    async getLeaderboard(num = 100) {
        return this.request(`/leaderboard?num=${num}`);
    }

    async getBemaStatus(apiKey) {
        return this.request('/agent/rooms/bema/status', apiKey, false);
    }

    async getSelf(apiKey) {
        return this.request('/agent/get_self', apiKey, false);
    }

    async findAgent(agentName, num = 100) {
        const response = await this.getLeaderboard(num);
        const leaderboard = response.leaderboard || [];
        const index = leaderboard.findIndex(a => 
            a.name && a.name.toLowerCase() === agentName.toLowerCase()
        );
        return index === -1 ? null : { ...leaderboard[index], rank: index + 1 };
    }
}

const API = { vortex: new VortexAPI() };
