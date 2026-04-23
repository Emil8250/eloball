import { useAuth0 } from "@auth0/auth0-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
    Briefcase,
    Check,
    Clock,
    Coffee,
    Crown,
    Flame,
    Globe,
    GraduationCap,
    Loader2,
    LogOut,
    Mail,
    Moon,
    Mountain,
    Plus,
    Rocket,
    Shield,
    ShieldAlert,
    ShieldCheck,
    Sun,
    Swords,
    Target,
    Trophy,
    Users,
    Zap,
    type LucideIcon,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "~/components/ui/dialog";
import {
    getActiveLeagueId,
    getAvailableLeagues,
    getUserLeagues,
    setActiveLeagueId,
    setUserLeagues,
    type LeagueIcon,
    type MockLeague,
} from "../../mocks/mockUserLeagues";

const LEAGUE_ICONS: Record<LeagueIcon, LucideIcon> = {
    trophy: Trophy,
    crown: Crown,
    swords: Swords,
    briefcase: Briefcase,
    sun: Sun,
    moon: Moon,
    coffee: Coffee,
    zap: Zap,
    rocket: Rocket,
    shield: Shield,
    target: Target,
    globe: Globe,
    mountain: Mountain,
    "graduation-cap": GraduationCap,
    flame: Flame,
};

function LeagueIconBadge({ icon, active }: { icon: LeagueIcon | undefined; active: boolean }) {
    const Icon = LEAGUE_ICONS[icon ?? "trophy"] ?? Trophy;
    return (
        <div
            className={`shrink-0 size-9 rounded-lg flex items-center justify-center ${
                active
                    ? "bg-sky-500/15 text-sky-600 dark:text-sky-400"
                    : "bg-muted text-muted-foreground"
            }`}
        >
            <Icon size={18} />
        </div>
    );
}

export function meta() {
    return [{ title: "Eloball — Profile" }];
}

function providerLabel(sub: string | undefined): string {
    if (!sub) return "Account";
    const prefix = sub.split("|")[0];
    if (prefix.startsWith("google")) return "Google";
    if (prefix === "github") return "GitHub";
    if (prefix === "auth0") return "Email";
    return prefix;
}

function initialsFrom(name: string | undefined, email: string | undefined): string {
    const source = (name ?? email ?? "?").trim();
    const parts = source.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return source.slice(0, 2).toUpperCase();
}

function formatRelative(iso: string | undefined): string | null {
    if (!iso) return null;
    const then = new Date(iso).getTime();
    if (Number.isNaN(then)) return null;
    const diffMs = Date.now() - then;
    const diffSec = Math.round(diffMs / 1000);
    const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
    const abs = Math.abs(diffSec);
    if (abs < 60) return rtf.format(-diffSec, "second");
    if (abs < 3600) return rtf.format(-Math.round(diffSec / 60), "minute");
    if (abs < 86400) return rtf.format(-Math.round(diffSec / 3600), "hour");
    if (abs < 2592000) return rtf.format(-Math.round(diffSec / 86400), "day");
    if (abs < 31536000) return rtf.format(-Math.round(diffSec / 2592000), "month");
    return rtf.format(-Math.round(diffSec / 31536000), "year");
}

function Avatar({ src, name, email }: { src: string | undefined; name: string | undefined; email: string | undefined }) {
    const [failed, setFailed] = useState(false);
    const showImage = src && !failed;

    if (showImage) {
        return (
            <img
                src={src}
                alt={name ?? "Avatar"}
                referrerPolicy="no-referrer"
                onError={() => setFailed(true)}
                className="size-20 rounded-full object-cover mx-auto mb-4 border border-border/50 shadow-sm"
            />
        );
    }

    return (
        <div className="size-20 rounded-full mx-auto mb-4 border border-border/50 shadow-sm bg-gradient-to-br from-sky-500 to-violet-500 text-white flex items-center justify-center text-xl font-bold tracking-wide select-none">
            {initialsFrom(name, email)}
        </div>
    );
}

export default function Profile() {
    const { user, isLoading, logout } = useAuth0();
    const [leagues, setLeagues] = useState<MockLeague[]>([]);
    const [activeId, setActiveId] = useState<number | null>(null);
    const [leaveTarget, setLeaveTarget] = useState<MockLeague | null>(null);
    const [switchTarget, setSwitchTarget] = useState<MockLeague | null>(null);
    const [joinTarget, setJoinTarget] = useState<MockLeague | null>(null);
    const [findOpen, setFindOpen] = useState(false);

    useEffect(() => {
        const initial = getUserLeagues();
        setLeagues(initial);

        let initialActive = getActiveLeagueId();
        if (initialActive === null || !initial.some((l) => l.id === initialActive)) {
            initialActive = initial[0]?.id ?? null;
            setActiveLeagueId(initialActive);
        }
        setActiveId(initialActive);
    }, []);

    const persistLeagues = (next: MockLeague[]) => {
        setLeagues(next);
        setUserLeagues(next);
    };

    const persistActive = (id: number | null) => {
        setActiveId(id);
        setActiveLeagueId(id);
    };

    const handleLeave = () => {
        if (!leaveTarget) return;
        const next = leagues.filter((l) => l.id !== leaveTarget.id);
        persistLeagues(next);
        if (activeId === leaveTarget.id) {
            persistActive(next[0]?.id ?? null);
        }
        toast.success(`Left ${leaveTarget.name}`);
        setLeaveTarget(null);
    };

    const handleSwitch = () => {
        if (!switchTarget) return;
        persistActive(switchTarget.id);
        toast.success(`Switched to ${switchTarget.name}`);
        setSwitchTarget(null);
    };

    const handleJoin = () => {
        if (!joinTarget) return;
        const joined: MockLeague = {
            ...joinTarget,
            memberCount: joinTarget.memberCount + 1,
            role: "Member",
        };
        const next = [...leagues, joined];
        persistLeagues(next);
        if (activeId === null) {
            persistActive(joined.id);
        }
        toast.success(`Joined ${joinTarget.name}`);
        setJoinTarget(null);
    };

    const openJoinConfirm = (league: MockLeague) => {
        setFindOpen(false);
        setJoinTarget(league);
    };

    const availableLeagues = getAvailableLeagues(leagues);
    const activeLeague = leagues.find((l) => l.id === activeId) ?? null;

    if (isLoading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <Loader2 size={32} className="animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!user) return null;

    const provider = providerLabel(user.sub);
    const lastSignedIn = formatRelative(user.updated_at);

    return (
        <div className="max-w-2xl mx-auto px-4 py-6">
            <div className="text-center mb-8 animate-slide-up">
                <Avatar src={user.picture} name={user.name} email={user.email} />
                <h1 className="text-2xl md:text-3xl font-extrabold">
                    {user.name ?? user.nickname ?? "Player"}
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Signed in with {provider}
                    {lastSignedIn && <> · {lastSignedIn}</>}
                </p>
                {activeLeague && (
                    <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider bg-sky-500/10 text-sky-600 dark:text-sky-400 rounded-full px-3 py-1">
                        <Trophy size={12} />
                        Playing in {activeLeague.name}
                    </div>
                )}
            </div>

            <div className="flex flex-col gap-3">
                <section
                    className="bg-card rounded-2xl border border-border/50 p-5 animate-slide-up"
                    style={{ animationDelay: "60ms" }}
                >
                    <div className="flex items-center gap-2 mb-3">
                        <Mail size={14} className="text-muted-foreground" />
                        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wide">
                            Account
                        </h2>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium truncate">
                            {user.email ?? "No email"}
                        </span>
                        {user.email && (
                            user.email_verified ? (
                                <span
                                    title="Email verified"
                                    className="shrink-0 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 rounded-full px-2 py-0.5"
                                >
                                    <ShieldCheck size={11} />
                                    Verified
                                </span>
                            ) : (
                                <span
                                    title="Email not verified"
                                    className="shrink-0 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-500/10 rounded-full px-2 py-0.5"
                                >
                                    <ShieldAlert size={11} />
                                    Unverified
                                </span>
                            )
                        )}
                        <span className="ml-auto shrink-0 text-[10px] font-bold uppercase tracking-wider bg-muted text-muted-foreground rounded-full px-2 py-0.5">
                            {provider}
                        </span>
                    </div>
                    {lastSignedIn && (
                        <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Clock size={12} />
                            Last signed in {lastSignedIn}
                        </div>
                    )}
                </section>

                <section
                    className="bg-card rounded-2xl border border-border/50 p-5 animate-slide-up"
                    style={{ animationDelay: "120ms" }}
                >
                    <div className="flex items-center gap-2 mb-3">
                        <Trophy size={14} className="text-muted-foreground" />
                        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wide">
                            Leagues
                        </h2>
                    </div>
                    {leagues.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            You haven't joined any leagues yet.
                        </p>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {leagues.map((league) => {
                                const isActive = league.id === activeId;
                                return (
                                    <div
                                        key={league.id}
                                        role={isActive ? undefined : "button"}
                                        tabIndex={isActive ? undefined : 0}
                                        onClick={() => !isActive && setSwitchTarget(league)}
                                        onKeyDown={(e) => {
                                            if (isActive) return;
                                            if (e.key === "Enter" || e.key === " ") {
                                                e.preventDefault();
                                                setSwitchTarget(league);
                                            }
                                        }}
                                        className={`rounded-xl border p-4 transition-all ${
                                            isActive
                                                ? "bg-sky-500/5 border-sky-500/50 ring-1 ring-sky-500/40 cursor-default"
                                                : "bg-background border-border/50 cursor-pointer hover:border-primary/50 hover:bg-primary/5 active:scale-[0.99]"
                                        }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <LeagueIconBadge icon={league.icon} active={isActive} />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start gap-2 mb-1">
                                                    <span className="font-bold truncate">{league.name}</span>
                                                    {isActive ? (
                                                        <span className="ml-auto shrink-0 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400 bg-sky-500/10 rounded-full px-2 py-0.5">
                                                            <Check size={11} />
                                                            Current
                                                        </span>
                                                    ) : (
                                                        <span className="ml-auto shrink-0 text-[10px] font-bold uppercase tracking-wider bg-muted text-muted-foreground rounded-full px-2 py-0.5">
                                                            {league.role}
                                                        </span>
                                                    )}
                                                </div>
                                                {league.description && (
                                                    <p className="text-sm text-muted-foreground">
                                                        {league.description}
                                                    </p>
                                                )}
                                                <div className="mt-2 flex items-center justify-between gap-2">
                                                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                        <Users size={12} />
                                                        {league.memberCount}{" "}
                                                        {league.memberCount === 1 ? "member" : "members"}
                                                    </span>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="cursor-pointer transition-all active:scale-95 hover:bg-destructive hover:text-white hover:border-destructive"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setLeaveTarget(league);
                                                        }}
                                                    >
                                                        Leave
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {availableLeagues.length > 0 && (
                        <Button
                            variant="outline"
                            size="sm"
                            className="mt-3 w-full cursor-pointer transition-transform active:scale-95"
                            onClick={() => setFindOpen(true)}
                        >
                            <Plus size={14} />
                            Find a league to join
                        </Button>
                    )}
                </section>

                <div
                    className="mt-2 flex justify-center animate-slide-up"
                    style={{ animationDelay: "180ms" }}
                >
                    <button
                        onClick={() =>
                            logout({ logoutParams: { returnTo: window.location.origin } })
                        }
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-muted-foreground cursor-pointer transition-all active:scale-95 hover:bg-destructive hover:text-white"
                    >
                        <LogOut size={16} />
                        Sign out
                    </button>
                </div>
            </div>

            <Dialog open={findOpen} onOpenChange={setFindOpen}>
                <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col gap-4">
                    <DialogHeader>
                        <DialogTitle>Find a league</DialogTitle>
                        <DialogDescription>
                            Tap a league to join it.
                        </DialogDescription>
                    </DialogHeader>
                    {availableLeagues.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-4 text-center">
                            No more leagues to join. You're in all of them.
                        </p>
                    ) : (
                        <div className="relative min-h-0 flex-1">
                            <div className="flex flex-col gap-2 overflow-y-auto pr-1 pb-6 max-h-[65vh]">
                                {availableLeagues.map((league) => (
                                    <button
                                        key={league.id}
                                        type="button"
                                        onClick={() => openJoinConfirm(league)}
                                        className="text-left rounded-xl border border-border/50 bg-background p-4 transition-all cursor-pointer hover:border-primary/50 hover:bg-primary/5 active:scale-[0.99]"
                                    >
                                        <div className="flex items-start gap-3">
                                            <LeagueIconBadge icon={league.icon} active={false} />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start gap-2 mb-1">
                                                    <span className="font-bold truncate">{league.name}</span>
                                                </div>
                                                {league.description && (
                                                    <p className="text-sm text-muted-foreground">
                                                        {league.description}
                                                    </p>
                                                )}
                                                <div className="mt-2 flex items-center justify-between gap-2">
                                                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                        <Users size={12} />
                                                        {league.memberCount}{" "}
                                                        {league.memberCount === 1 ? "member" : "members"}
                                                    </span>
                                                    <span className="text-xs font-semibold text-primary">
                                                        Tap to join →
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-background to-transparent rounded-b-lg" />
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <Dialog
                open={joinTarget !== null}
                onOpenChange={(open) => !open && setJoinTarget(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Join {joinTarget?.name}?</DialogTitle>
                        <DialogDescription>
                            You'll be added as a Member and can start playing matches in this league.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            className="cursor-pointer"
                            onClick={() => setJoinTarget(null)}
                        >
                            Cancel
                        </Button>
                        <Button className="cursor-pointer" onClick={handleJoin}>
                            Join league
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog
                open={switchTarget !== null}
                onOpenChange={(open) => !open && setSwitchTarget(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Switch to {switchTarget?.name}?</DialogTitle>
                        <DialogDescription>
                            Matches you play will be recorded in this league. You can switch back anytime.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            className="cursor-pointer"
                            onClick={() => setSwitchTarget(null)}
                        >
                            Cancel
                        </Button>
                        <Button className="cursor-pointer" onClick={handleSwitch}>
                            Switch league
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog
                open={leaveTarget !== null}
                onOpenChange={(open) => !open && setLeaveTarget(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Leave {leaveTarget?.name}?</DialogTitle>
                        <DialogDescription>
                            You'll stop appearing on this league's leaderboards. You can rejoin later.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            className="cursor-pointer"
                            onClick={() => setLeaveTarget(null)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            className="cursor-pointer"
                            onClick={handleLeave}
                        >
                            Leave league
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
