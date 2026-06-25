import { useAuth0 } from "@auth0/auth0-react";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { skipToken } from "@reduxjs/toolkit/query";
import { toast } from "~/lib/toast";
import {
    Check,
    Clock,
    Crown,
    Gamepad2,
    Loader2,
    LogOut,
    Mail,
    Pencil,
    Plus,
    Settings2,
    Shield,
    ShieldAlert,
    ShieldCheck,
    Trash2,
    UserMinus,
    Users,
} from "lucide-react";
import {
    useGetMeQuery,
    useRenamePlayerMutation,
    useGetMyLeaguesQuery,
    useGetLeaguesQuery,
    useGetLeagueMembersQuery,
    useGetActiveSeasonQuery,
    useGetSeasonLeaderboardQuery,
    useCreateLeagueMutation,
    useRenameLeagueMutation,
    useJoinLeagueMutation,
    useLeaveLeagueMutation,
    useClaimOwnershipMutation,
    useDelegateOwnershipMutation,
    useRemoveMemberMutation,
    useDeleteLeagueMutation,
} from "../../apis/foosball/foosball";
import type { MyLeague } from "../../apis/foosball/types";
import { setCurrentLeague } from "~/leagueSlice";
import { useCurrentLeague } from "~/lib/useCurrentLeague";
import { CurrentLeagueBadge } from "~/components/CurrentLeagueBadge";
import { Button } from "~/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "~/components/ui/dialog";

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
    const diffSec = Math.round((Date.now() - then) / 1000);
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
    if (src && !failed) {
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

/** Owner's member-management dialog: delegate ownership or remove members. */
function ManageMembersDialog({ league, myPlayerId, onClose }: { league: MyLeague | null; myPlayerId: number | undefined; onClose: () => void }) {
    const { data: members } = useGetLeagueMembersQuery(league?.id ?? skipToken);
    const [delegateOwnership, { isLoading: delegating }] = useDelegateOwnershipMutation();
    const [removeMember, { isLoading: removing }] = useRemoveMemberMutation();
    const busy = delegating || removing;

    const handleDelegate = async (playerId: number, name: string) => {
        if (!league) return;
        try {
            await delegateOwnership({ id: league.id, playerId }).unwrap();
            toast.success(`${name} is now the owner`);
            onClose();
        } catch {
            toast.error("Couldn't transfer ownership.");
        }
    };

    const handleRemove = async (playerId: number, name: string) => {
        if (!league) return;
        try {
            await removeMember({ id: league.id, playerId }).unwrap();
            toast.success(`Removed ${name}`);
        } catch {
            toast.error("Couldn't remove that member.");
        }
    };

    return (
        <Dialog open={league !== null} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col gap-4">
                <DialogHeader>
                    <DialogTitle>Manage {league?.name}</DialogTitle>
                    <DialogDescription>Transfer ownership or remove members.</DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-2 overflow-y-auto pr-1 max-h-[60vh]">
                    {(members ?? []).map((m) => (
                        <div key={m.playerId} className="flex items-center gap-2 rounded-xl border border-border/50 bg-background px-3 py-2.5">
                            <span className="flex-1 min-w-0 font-semibold text-sm truncate">{m.name}</span>
                            {m.role === "Owner" ? (
                                <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-500/10 rounded-full px-2 py-0.5">
                                    <Crown size={11} /> Owner
                                </span>
                            ) : (
                                <>
                                    <Button size="sm" variant="outline" className="cursor-pointer" disabled={busy} onClick={() => handleDelegate(m.playerId, m.name)}>
                                        <Crown size={13} /> Make owner
                                    </Button>
                                    <Button size="sm" variant="outline" className="cursor-pointer hover:bg-destructive hover:text-white hover:border-destructive" disabled={busy || m.playerId === myPlayerId} onClick={() => handleRemove(m.playerId, m.name)}>
                                        <UserMinus size={13} />
                                    </Button>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default function Profile() {
    const { user, isLoading, logout } = useAuth0();
    const dispatch = useDispatch();
    const currentLeagueId = useCurrentLeague();

    const { data: me } = useGetMeQuery();
    const [renamePlayer, { isLoading: renaming }] = useRenamePlayerMutation();

    const { data: myLeagues } = useGetMyLeaguesQuery();
    const [joinLeague] = useJoinLeagueMutation();
    const [leaveLeague] = useLeaveLeagueMutation();
    const [createLeague, { isLoading: creating }] = useCreateLeagueMutation();
    const [renameLeague, { isLoading: renamingLeague }] = useRenameLeagueMutation();
    const [claimOwnership] = useClaimOwnershipMutation();
    const [deleteLeague] = useDeleteLeagueMutation();

    // Player's rating in the current league's active season.
    const { data: activeSeason } = useGetActiveSeasonQuery(currentLeagueId ?? skipToken);
    const { data: activeLb } = useGetSeasonLeaderboardQuery(activeSeason?.id ?? skipToken);
    const myElo = activeLb?.find((e) => e.playerId === me?.id)?.latestElo ?? null;

    // Player rename
    const [renameOpen, setRenameOpen] = useState(false);
    const [renameValue, setRenameValue] = useState("");
    // League dialogs
    const [findOpen, setFindOpen] = useState(false);
    const [createOpen, setCreateOpen] = useState(false);
    const [newLeagueName, setNewLeagueName] = useState("");
    const [leaveTarget, setLeaveTarget] = useState<MyLeague | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<MyLeague | null>(null);
    const [renameLeagueTarget, setRenameLeagueTarget] = useState<MyLeague | null>(null);
    const [leagueNameValue, setLeagueNameValue] = useState("");
    const [manageTarget, setManageTarget] = useState<MyLeague | null>(null);

    const { data: allLeagues } = useGetLeaguesQuery(undefined, { skip: !findOpen });
    const joinable = (allLeagues ?? []).filter((l) => !l.isMember);

    const handleRename = async () => {
        const name = renameValue.trim();
        if (!name || name === me?.name) return setRenameOpen(false);
        try {
            await renamePlayer({ name }).unwrap();
            toast.success(`Renamed to ${name}`);
            setRenameOpen(false);
        } catch {
            toast.error("Couldn't rename your player.");
        }
    };

    const handleSwitch = (l: MyLeague) => {
        dispatch(setCurrentLeague(l.id));
        toast.success(`Switched to ${l.name}`);
    };

    const handleJoin = async (id: number, name: string) => {
        try {
            await joinLeague(id).unwrap();
            toast.success(`Joined ${name}`);
            setFindOpen(false);
        } catch {
            toast.error("Couldn't join that league.");
        }
    };

    const pickFallbackLeague = (excludeId: number) =>
        (myLeagues ?? []).find((l) => l.id !== excludeId)?.id ?? null;

    const handleLeave = async () => {
        if (!leaveTarget) return;
        try {
            await leaveLeague(leaveTarget.id).unwrap();
            if (currentLeagueId === leaveTarget.id) dispatch(setCurrentLeague(pickFallbackLeague(leaveTarget.id)));
            toast.success(`Left ${leaveTarget.name}`);
            setLeaveTarget(null);
        } catch (e) {
            toast.error((e as { data?: string })?.data ?? "Couldn't leave the league.");
        }
    };

    const handleCreate = async () => {
        const name = newLeagueName.trim();
        if (!name) return;
        try {
            const created = await createLeague({ name }).unwrap();
            dispatch(setCurrentLeague(created.id));
            toast.success(`Created ${created.name}`);
            setCreateOpen(false);
            setNewLeagueName("");
        } catch {
            toast.error("Couldn't create the league.");
        }
    };

    const handleRenameLeague = async () => {
        const name = leagueNameValue.trim();
        if (!renameLeagueTarget || !name) return;
        try {
            await renameLeague({ id: renameLeagueTarget.id, name }).unwrap();
            toast.success("League renamed");
            setRenameLeagueTarget(null);
        } catch {
            toast.error("Couldn't rename the league.");
        }
    };

    const handleClaim = async (l: MyLeague) => {
        try {
            await claimOwnership(l.id).unwrap();
            toast.success(`You're now the owner of ${l.name}`);
        } catch {
            toast.error("Couldn't claim ownership.");
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            await deleteLeague(deleteTarget.id).unwrap();
            if (currentLeagueId === deleteTarget.id) dispatch(setCurrentLeague(pickFallbackLeague(deleteTarget.id)));
            toast.success(`Deleted ${deleteTarget.name}`);
            setDeleteTarget(null);
        } catch (e) {
            toast.error((e as { data?: string })?.data ?? "Couldn't delete the league.");
        }
    };

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
    const currentLeague = myLeagues?.find((l) => l.id === currentLeagueId) ?? null;

    return (
        <div className="max-w-2xl mx-auto px-4 py-6">
            <div className="text-center mb-8 animate-slide-up">
                <Avatar src={user.picture} name={user.name} email={user.email} />
                <h1 className="text-2xl md:text-3xl font-extrabold">{user.name ?? user.nickname ?? "Player"}</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Signed in with {provider}
                    {lastSignedIn && <> · {lastSignedIn}</>}
                </p>
                {currentLeague && (
                    <div className="mt-3">
                        <CurrentLeagueBadge inline />
                    </div>
                )}
            </div>

            <div className="flex flex-col gap-3">
                {/* Account */}
                <section className="bg-card rounded-2xl border border-border/50 p-5 animate-slide-up" style={{ animationDelay: "60ms" }}>
                    <div className="flex items-center gap-2 mb-3">
                        <Mail size={14} className="text-muted-foreground" />
                        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wide">Account</h2>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium truncate">{user.email ?? "No email"}</span>
                        {user.email && (user.email_verified ? (
                            <span title="Email verified" className="shrink-0 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 rounded-full px-2 py-0.5">
                                <ShieldCheck size={11} /> Verified
                            </span>
                        ) : (
                            <span title="Email not verified" className="shrink-0 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-500/10 rounded-full px-2 py-0.5">
                                <ShieldAlert size={11} /> Unverified
                            </span>
                        ))}
                        <span className="ml-auto shrink-0 text-[10px] font-bold uppercase tracking-wider bg-muted text-muted-foreground rounded-full px-2 py-0.5">{provider}</span>
                    </div>
                    {lastSignedIn && (
                        <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Clock size={12} /> Last signed in {lastSignedIn}
                        </div>
                    )}
                </section>

                {/* Player */}
                <section className="bg-card rounded-2xl border border-border/50 p-5 animate-slide-up" style={{ animationDelay: "90ms" }}>
                    <div className="flex items-center gap-2 mb-3">
                        <Gamepad2 size={14} className="text-muted-foreground" />
                        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wide">Player</h2>
                    </div>
                    {me ? (
                        <div className="flex items-center gap-3">
                            <div className="flex-1 min-w-0">
                                <p className="font-bold truncate">{me.name}</p>
                                <p className="text-xs text-muted-foreground tabular-nums">
                                    {myElo != null ? `${myElo} ELO${currentLeague ? ` · ${currentLeague.name}` : ""}` : "Unranked this season"}
                                </p>
                            </div>
                            <Button variant="outline" size="sm" className="cursor-pointer transition-transform active:scale-95" onClick={() => { setRenameValue(me.name); setRenameOpen(true); }}>
                                <Pencil size={14} /> Rename
                            </Button>
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">No player linked.</p>
                    )}
                </section>

                {/* Leagues */}
                <section className="bg-card rounded-2xl border border-border/50 p-5 animate-slide-up" style={{ animationDelay: "120ms" }}>
                    <div className="flex items-center gap-2 mb-3">
                        <Shield size={14} className="text-muted-foreground" />
                        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wide">Leagues</h2>
                    </div>
                    <div className="flex flex-col gap-2">
                        {(myLeagues ?? []).map((league) => {
                            const isActive = league.id === currentLeagueId;
                            const isOwner = league.role === "Owner";
                            return (
                                <div
                                    key={league.id}
                                    className={`rounded-xl border p-4 transition-all ${isActive ? "bg-sky-500/5 border-sky-500/50 ring-1 ring-sky-500/40" : "bg-background border-border/50"}`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={`shrink-0 size-9 rounded-lg flex items-center justify-center ${isActive ? "bg-sky-500/15 text-sky-600 dark:text-sky-400" : "bg-muted text-muted-foreground"}`}>
                                            <Shield size={18} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-bold truncate">{league.name}</span>
                                                {isActive && (
                                                    <span className="ml-auto shrink-0 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400 bg-sky-500/10 rounded-full px-2 py-0.5">
                                                        <Check size={11} /> Current
                                                    </span>
                                                )}
                                                <span className={`shrink-0 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider rounded-full px-2 py-0.5 ${isActive ? "" : "ml-auto"} ${isOwner ? "text-amber-600 dark:text-amber-400 bg-amber-500/10" : "bg-muted text-muted-foreground"}`}>
                                                    {isOwner && <Crown size={10} />}{league.role}
                                                </span>
                                            </div>
                                            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                <Users size={12} />
                                                {league.memberCount} {league.memberCount === 1 ? "member" : "members"}
                                            </span>

                                            <div className="mt-2.5 flex flex-wrap gap-1.5">
                                                {!isActive && (
                                                    <Button size="sm" className="cursor-pointer" onClick={() => handleSwitch(league)}>Open</Button>
                                                )}
                                                {isOwner && (
                                                    <>
                                                        <Button size="sm" variant="outline" className="cursor-pointer" onClick={() => { setLeagueNameValue(league.name); setRenameLeagueTarget(league); }}>
                                                            <Pencil size={13} /> Rename
                                                        </Button>
                                                        <Button size="sm" variant="outline" className="cursor-pointer" onClick={() => setManageTarget(league)}>
                                                            <Settings2 size={13} /> Members
                                                        </Button>
                                                        <Button size="sm" variant="outline" className="cursor-pointer hover:bg-destructive hover:text-white hover:border-destructive disabled:opacity-40" disabled={league.memberCount > 1} title={league.memberCount > 1 ? "Remove all other members first" : undefined} onClick={() => setDeleteTarget(league)}>
                                                            <Trash2 size={13} /> Delete
                                                        </Button>
                                                    </>
                                                )}
                                                {!league.hasOwner && (
                                                    <Button size="sm" variant="outline" className="cursor-pointer" onClick={() => handleClaim(league)}>
                                                        <Crown size={13} /> Claim ownership
                                                    </Button>
                                                )}
                                                <Button size="sm" variant="outline" className="cursor-pointer hover:bg-destructive hover:text-white hover:border-destructive ml-auto" onClick={() => setLeaveTarget(league)}>
                                                    Leave
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2">
                        <Button variant="outline" size="sm" className="cursor-pointer" onClick={() => setFindOpen(true)}>
                            <Plus size={14} /> Find a league
                        </Button>
                        <Button variant="outline" size="sm" className="cursor-pointer" onClick={() => { setNewLeagueName(""); setCreateOpen(true); }}>
                            <Shield size={14} /> Create league
                        </Button>
                    </div>
                </section>

                <div className="mt-2 flex justify-center animate-slide-up" style={{ animationDelay: "180ms" }}>
                    <button
                        onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-muted-foreground cursor-pointer transition-all active:scale-95 hover:bg-destructive hover:text-white"
                    >
                        <LogOut size={16} /> Sign out
                    </button>
                </div>
            </div>

            {/* Find a league */}
            <Dialog open={findOpen} onOpenChange={setFindOpen}>
                <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col gap-4">
                    <DialogHeader>
                        <DialogTitle>Find a league</DialogTitle>
                        <DialogDescription>Join any league below.</DialogDescription>
                    </DialogHeader>
                    {joinable.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-4 text-center">No other leagues to join.</p>
                    ) : (
                        <div className="flex flex-col gap-2 overflow-y-auto pr-1 max-h-[65vh]">
                            {joinable.map((l) => (
                                <div key={l.id} className="flex items-center gap-3 rounded-xl border border-border/50 bg-background px-4 py-3">
                                    <div className="shrink-0 size-9 rounded-lg bg-muted text-muted-foreground flex items-center justify-center"><Shield size={18} /></div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-sm truncate">{l.name}</p>
                                        <p className="text-xs text-muted-foreground flex items-center gap-1"><Users size={11} />{l.memberCount} {l.memberCount === 1 ? "member" : "members"}</p>
                                    </div>
                                    <Button size="sm" className="cursor-pointer shrink-0" onClick={() => handleJoin(l.id, l.name)}>Join</Button>
                                </div>
                            ))}
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Create league */}
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create a league</DialogTitle>
                        <DialogDescription>You'll be the owner. You can rename or delete it later.</DialogDescription>
                    </DialogHeader>
                    <input
                        value={newLeagueName}
                        onChange={(e) => setNewLeagueName(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleCreate(); } }}
                        autoFocus
                        placeholder="League name"
                        className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-sm outline-none focus:border-primary"
                    />
                    <DialogFooter>
                        <Button variant="outline" className="cursor-pointer" onClick={() => setCreateOpen(false)}>Cancel</Button>
                        <Button className="cursor-pointer" disabled={!newLeagueName.trim() || creating} onClick={handleCreate}>
                            {creating && <Loader2 size={16} className="animate-spin" />} Create
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Rename league */}
            <Dialog open={renameLeagueTarget !== null} onOpenChange={(open) => !open && setRenameLeagueTarget(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Rename league</DialogTitle>
                    </DialogHeader>
                    <input
                        value={leagueNameValue}
                        onChange={(e) => setLeagueNameValue(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleRenameLeague(); } }}
                        autoFocus
                        placeholder="League name"
                        className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-sm outline-none focus:border-primary"
                    />
                    <DialogFooter>
                        <Button variant="outline" className="cursor-pointer" onClick={() => setRenameLeagueTarget(null)}>Cancel</Button>
                        <Button className="cursor-pointer" disabled={!leagueNameValue.trim() || renamingLeague} onClick={handleRenameLeague}>
                            {renamingLeague && <Loader2 size={16} className="animate-spin" />} Save
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Manage members (owner) */}
            <ManageMembersDialog league={manageTarget} myPlayerId={me?.id} onClose={() => setManageTarget(null)} />

            {/* Leave */}
            <Dialog open={leaveTarget !== null} onOpenChange={(open) => !open && setLeaveTarget(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Leave {leaveTarget?.name}?</DialogTitle>
                        <DialogDescription>You'll stop appearing on this league's leaderboards. You can rejoin later.</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" className="cursor-pointer" onClick={() => setLeaveTarget(null)}>Cancel</Button>
                        <Button variant="destructive" className="cursor-pointer" onClick={handleLeave}>Leave league</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete */}
            <Dialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete {deleteTarget?.name}?</DialogTitle>
                        <DialogDescription>This permanently deletes the league and all its seasons and matches. This can't be undone.</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" className="cursor-pointer" onClick={() => setDeleteTarget(null)}>Cancel</Button>
                        <Button variant="destructive" className="cursor-pointer" onClick={handleDelete}>Delete league</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Rename player */}
            <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Rename player</DialogTitle>
                        <DialogDescription>This changes your player name everywhere — leaderboards, matches and stats.</DialogDescription>
                    </DialogHeader>
                    <input
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleRename(); } }}
                        autoFocus
                        placeholder="Player name"
                        className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-sm outline-none focus:border-primary"
                    />
                    <DialogFooter>
                        <Button variant="outline" className="cursor-pointer" onClick={() => setRenameOpen(false)}>Cancel</Button>
                        <Button className="cursor-pointer" disabled={!renameValue.trim() || renaming} onClick={handleRename}>
                            {renaming && <Loader2 size={16} className="animate-spin" />} Save
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
