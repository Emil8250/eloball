import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
    index("routes/leaderboard.tsx"),
    route("seasons", "routes/seasons.tsx"),
    route("seasons/:id", "routes/season-detail.tsx"),
    route("game", "routes/game.tsx"),
    route("stats", "routes/stats.tsx"),
    route("profile", "routes/profile.tsx"),
] satisfies RouteConfig;
