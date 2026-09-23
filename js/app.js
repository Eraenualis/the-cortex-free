// js/app.js — The Cortex Free: lookup YOUR agent in top 100, 30-min cache

class CortexApp {
    constructor() {
        this.api = API;
        this.templates = {};
        this.ourAgents = [];
        this.init();
    }

    async init() {
        // Cache templates
        this.templates.leaderboardRow = document.getElementById('leaderboard-row-template').innerHTML;
        this.templates.statusResult = document.getElementById('status-result-template').innerHTML;

        // Bind events
        this.bindEvents();

        // Load our agents from config
        await this.loadOurAgents();

        // Load + highlight our agents
        await this.loadAndRenderAgents();
    }

    async loadOurAgents() {
        try {
            const res = await fetch('data/agents.json');
            this.ourAgents = await res.json();
        } catch (e) {
            this.ourAgents = [];
        }
    }

    bindEvents() {
        document.getElementById('status-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.checkStatus();
        });

        // Footer TOU link: re-open the Terms of Use modal anytime
        const touLink = document.getElementById('footer-tou-link');
        if (touLink) {
            touLink.addEventListener('click', (e) => {
                e.preventDefault();
                TOU.show();
            });
        }

        document.getElementById('eta-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.calculateETA();
        });
    }

    async loadAndRenderAgents() {
        try {
            // 30-min cache is in api.js — this returns cached data if fresh
            const response = await this.api.vortex.getLeaderboard(100);
            const leaderboard = response.leaderboard || [];

            // Find our agents in top 100
            const ourInTop100 = leaderboard
                .map((a, i) => ({ ...a, rank: i + 1 }))
                .filter(a => this.ourAgents.some(b => b.name === a.name));

            this.renderLeaderboard(ourInTop100);
        } catch (e) {
            console.error('Failed to load leaderboard:', e);
            document.getElementById('leaderboard-list').innerHTML = 
                '<p class="error">Failed to load. Try again later.</p>';
        }
    }

    renderLeaderboard(entries) {
        const container = document.getElementById('leaderboard-list');

        if (entries.length === 0) {
            container.innerHTML = '<p>None of our agents are in the top 100 right now.</p>';
            return;
        }

        container.innerHTML = entries.map(entry => 
            Mustache.render(this.templates.leaderboardRow, {
                rank: entry.rank,
                name: entry.name || 'Unknown',
                points: entry.points || 0
            })
        ).join('');
    }

    async checkStatus() {
        // TOU gate: must be accepted BEFORE the API key is transmitted.
        if (!TOU.gatePasses()) {
            const accepted = await TOU.show();
            if (!accepted) {
                document.getElementById('status-result').innerHTML =
                    '<p class="error">You must accept the Terms of Use to check agent status.</p>';
                return;
            }
        }

        const agentName = document.getElementById('agent-name').value;
        const apiKey = document.getElementById('api-key').value;

        try {
            // PRIMARY: live Bema status via the API key (works for ANY agent,
            // not just top-100). Position/status straight from VORTEX.
            const bema = await this.api.vortex.getBemaStatus(apiKey);

            if (!bema || bema.error) {
                const msg = (bema && bema.error && bema.error.message) || 'Lookup failed';
                document.getElementById('status-result').innerHTML =
                    `<p class="error">${msg}. Check your agent name and API key.</p>`;
                return;
            }

            // SECONDARY: leaderboard search for rank display (top 100 only)
            const board = await this.api.vortex.findAgent(agentName, 100);
            const rank = board ? board.rank : null;

            const state = bema.status; // waitlisted | active | active_closed | not_requested
            const position = bema.position;
            const statusText = {
                'waitlisted': 'Waitlisted',
                'active': 'Active in Bema',
                'active_closed': 'In Bema (round closed, read-only)',
                'not_requested': 'Not on the waitlist'
            }[state] || state;

            // Store position for ETA (only meaningful while waitlisted)
            if (state === 'waitlisted' && typeof position === 'number' && position > 0) {
                const storage = Storage.get(agentName);
                storage.add(position);
                const velocity = storage.calculateVelocity();
                var etaMin = Math.round(position * velocity);
            }

            const result = {
                agent: agentName,
                status: statusText,
                position: (state === 'waitlisted' || state === 'active') ? position : '—',
                rank: rank ? `#${rank}` : 'not in top 100',
                eta: (state === 'waitlisted' && etaMin) ? `${etaMin} min` : '—'
            };

            document.getElementById('status-result').innerHTML =
                Mustache.render(this.templates.statusResult, result);
        } catch (e) {
            document.getElementById('status-result').innerHTML =
                `<p class="error">Error: ${e.message}</p>`;
        }
    }

    calculateETA() {
        const pos = parseInt(document.getElementById('current-pos').value);
        if (isNaN(pos) || pos < 0) {
            document.getElementById('eta-result').innerHTML = '<p class="error">Invalid position</p>';
            return;
        }

        const velocity = 3.0;
        const etaMin = pos * velocity;
        const hours = Math.floor(etaMin / 60);
        const mins = etaMin % 60;

        document.getElementById('eta-result').innerHTML = 
            `<p>ETA until Bema: <strong>${hours}h ${mins}m</strong></p>`;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new CortexApp();
});
