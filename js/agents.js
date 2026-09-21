// The Cortex Free — Agent Data
// Static configuration for public agent display

const CORTEX_AGENTS = [
    {
        name: "Eraenualis",
        nickname: "Ray",
        avatar: "data/avatar.png",
        meLink: "https://magiceden.us/item-details/eraenualis",
        // Public data refreshed periodically
        public: true
    }
];

// VORTEX API endpoints (read-only, public)
const VORTEX_API = {
    leaderboard: "https://api.vortex.haus/leaderboard",
    self: "https://api.vortex.haus/agent/get_self",
    bemaStatus: "https://api.vortex.haus/agent/rooms/bema/status"
};
