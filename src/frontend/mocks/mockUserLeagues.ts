export type LeagueIcon =
    | "trophy"
    | "crown"
    | "swords"
    | "briefcase"
    | "sun"
    | "moon"
    | "coffee"
    | "zap"
    | "rocket"
    | "shield"
    | "target"
    | "globe"
    | "mountain"
    | "graduation-cap"
    | "flame";

export interface MockLeague {
    id: number;
    name: string;
    description?: string;
    memberCount: number;
    role: "Owner" | "Member";
    icon: LeagueIcon;
}

const STORAGE_KEY = "eloball_mock_user_leagues_v1";
const ACTIVE_KEY = "eloball_mock_active_league_v1";

const defaults: MockLeague[] = [
    {
        id: 1,
        name: "Billigeterninger",
        description: "The original crew. Fierce rivalries, questionable calls.",
        memberCount: 8,
        role: "Member",
        icon: "trophy",
    },
    {
        id: 2,
        name: "Office Warriors",
        description: "Lunchtime showdowns.",
        memberCount: 4,
        role: "Owner",
        icon: "briefcase",
    },
    {
        id: 3,
        name: "Weekend Legends",
        description: "Casual weekend games. All skill levels welcome.",
        memberCount: 2,
        role: "Member",
        icon: "sun",
    },
];

export function getUserLeagues(): MockLeague[] {
    if (typeof window === "undefined") return defaults;
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return defaults;
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return defaults;
        return parsed as MockLeague[];
    } catch {
        return defaults;
    }
}

export function setUserLeagues(leagues: MockLeague[]): void {
    if (typeof window === "undefined") return;
    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(leagues));
    } catch {
        // ignore quota / unavailable storage
    }
}

export function getActiveLeagueId(): number | null {
    if (typeof window === "undefined") return null;
    try {
        const raw = window.localStorage.getItem(ACTIVE_KEY);
        if (!raw) return null;
        const parsed = Number(raw);
        return Number.isFinite(parsed) ? parsed : null;
    } catch {
        return null;
    }
}

export function setActiveLeagueId(id: number | null): void {
    if (typeof window === "undefined") return;
    try {
        if (id === null) {
            window.localStorage.removeItem(ACTIVE_KEY);
        } else {
            window.localStorage.setItem(ACTIVE_KEY, String(id));
        }
    } catch {
        // ignore
    }
}

export const AVAILABLE_LEAGUE_POOL: MockLeague[] = [
    {
        id: 101,
        name: "Champions Arena",
        description: "Elite competitive play. Bring your A-game.",
        memberCount: 12,
        role: "Member",
        icon: "crown",
    },
    {
        id: 102,
        name: "Friday Night Fighters",
        description: "Chill after-work matches with cold beverages.",
        memberCount: 6,
        role: "Member",
        icon: "moon",
    },
    {
        id: 103,
        name: "Rookie Club",
        description: "Beginner-friendly league. Learn the ropes.",
        memberCount: 9,
        role: "Member",
        icon: "graduation-cap",
    },
    {
        id: 104,
        name: "Nordic Open",
        description: "Cross-office rivalry across the Nordics.",
        memberCount: 18,
        role: "Member",
        icon: "mountain",
    },
    {
        id: 105,
        name: "Coffee Break Crew",
        description: "Quick rounds during the workday. Five minutes, no warm-up.",
        memberCount: 5,
        role: "Member",
        icon: "coffee",
    },
    {
        id: 106,
        name: "The Spin Doctors",
        description: "For players who believe in the perfect wrist flick.",
        memberCount: 7,
        role: "Member",
        icon: "zap",
    },
    {
        id: 107,
        name: "Basement Brawlers",
        description: "Saturday nights, questionable decisions, legendary games.",
        memberCount: 11,
        role: "Member",
        icon: "swords",
    },
    {
        id: 108,
        name: "Startup Hustlers",
        description: "Matches between pitch meetings and stand-ups.",
        memberCount: 14,
        role: "Member",
        icon: "rocket",
    },
    {
        id: 109,
        name: "The Veterans",
        description: "Old-school players who remember the golden era.",
        memberCount: 8,
        role: "Member",
        icon: "shield",
    },
    {
        id: 110,
        name: "Late Night League",
        description: "Games after midnight. Bring coffee or ambition.",
        memberCount: 4,
        role: "Member",
        icon: "flame",
    },
    {
        id: 111,
        name: "The Precision Squad",
        description: "Calculated shots, no wild spins. Chess meets foosball.",
        memberCount: 6,
        role: "Member",
        icon: "target",
    },
    {
        id: 112,
        name: "Global Goalgetters",
        description: "Remote-first league with players from three continents.",
        memberCount: 21,
        role: "Member",
        icon: "globe",
    },
];

export function getAvailableLeagues(joined: MockLeague[]): MockLeague[] {
    const joinedIds = new Set(joined.map((l) => l.id));
    return AVAILABLE_LEAGUE_POOL.filter((l) => !joinedIds.has(l.id));
}
