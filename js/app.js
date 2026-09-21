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
        const agentName = document.getElementById('agent-name').value;
        const apiKey = document.getElementById('api-key').value;

        try {
            // Find agent in leaderboard (uses 30-min cache)
            const agent = await this.api.vortex.findAgent(agentName, 100);

            if (!agent) {
                document.getElementById('status-result').innerHTML = 
                    `<p class="error">${agentName} not found in top 100. Check name or try again later.</p>`;
                return;
            }

            // Store position in localStorage for ETA
            const storage = Storage.get(agentName);
            storage.add(agent.position);

            // Calculate ETA from history
            const velocity = storage.calculateVelocity();
            const eta = Math.round(agent.position * velocity);

            const result = {
                agent: agentName,
                status: agent.position === 0 ? 'Active' : 'Waitlisted',
                position: agent.position,
                eta: eta ? `${eta} min` : 'N/A'
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
            `<p>Estimated time: <strong>${hours}h ${mins}m</strong></p>`;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new CortexApp();
});
