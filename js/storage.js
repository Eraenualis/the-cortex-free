// js/storage.js — localStorage management for ETA history

class PositionStorage {
    constructor(agentName) {
        this.key = `cortex_pos_history_${agentName}`;
    }

    getAll() {
        try {
            const data = localStorage.getItem(this.key);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            return [];
        }
    }

    add(position) {
        const history = this.getAll();
        history.push({
            timestamp: Date.now(),
            position: position
        });
        // Keep last 100 entries
        if (history.length > 100) {
            history.shift();
        }
        localStorage.setItem(this.key, JSON.stringify(history));
        return history;
    }

    calculateVelocity() {
        const history = this.getAll();
        if (history.length < 2) return 3.0; // Default 3 min/position

        const changes = [];
        for (let i = 0; i < history.length - 1; i++) {
            const posDiff = history[i].position - history[i + 1].position;
            const timeDiff = (history[i].timestamp - history[i + 1].timestamp) / 60000;
            if (posDiff > 0 && timeDiff > 0) {
                changes.push(timeDiff / posDiff);
            }
        }

        if (changes.length === 0) return 3.0;

        changes.sort((a, b) => a - b);
        const median = changes[Math.floor(changes.length / 2)];
        return Math.max(1.0, Math.min(10.0, median));
    }

    clear() {
        localStorage.removeItem(this.key);
    }
}

// Global storage for all agents
const Storage = {
    agents: {},

    get(agentName) {
        if (!this.agents[agentName]) {
            this.agents[agentName] = new PositionStorage(agentName);
        }
        return this.agents[agentName];
    }
};
