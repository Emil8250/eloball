import { useEffect, useMemo, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { toast } from "~/lib/toast";
import { Check, Loader2, LogOut, Search, UserPlus } from "lucide-react";
import {
    useGetUnclaimedPlayersQuery,
    useClaimPlayerMutation,
    useCreatePlayerMutation,
} from "../../apis/foosball/foosball";
import { Button } from "~/components/ui/button";

export function Onboarding() {
    const { user, logout } = useAuth0();
    const { data: players, isLoading } = useGetUnclaimedPlayersQuery();
    const [claimPlayer, { isLoading: claiming }] = useClaimPlayerMutation();
    const [createPlayer, { isLoading: creating }] = useCreatePlayerMutation();

    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [query, setQuery] = useState("");
    const [showCreate, setShowCreate] = useState(false);
    const [newName, setNewName] = useState(user?.name ?? user?.nickname ?? "");

    const noPlayersToClaim = !isLoading && (players?.length ?? 0) === 0;

    // Nothing to claim → go straight to creating a player.
    useEffect(() => {
        if (noPlayersToClaim) setShowCreate(true);
    }, [noPlayersToClaim]);

    const busy = claiming || creating;

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        const list = players ?? [];
        return q ? list.filter((p) => p.name.toLowerCase().includes(q)) : list;
    }, [players, query]);

    const selected = players?.find((p) => p.id === selectedId) ?? null;

    const handleClaim = async () => {
        if (!selected) return;
        try {
            await claimPlayer({ playerId: selected.id, email: user?.email }).unwrap();
            toast.success(`You're now playing as ${selected.name}`);
            // "me" tag invalidates → the app shell re-renders into the app.
        } catch {
            toast.error("Couldn't claim that player — it may have just been taken.");
            setSelectedId(null);
        }
    };

    const handleCreate = async () => {
        const name = newName.trim();
        if (!name) return;
        try {
            await createPlayer({ name, email: user?.email }).unwrap();
            toast.success(`Created your player ${name}`);
        } catch {
            toast.error("Couldn't create your player. Try again.");
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center px-6 py-10">
            <div className="w-full max-w-md flex flex-col gap-6 rounded-2xl bg-white dark:bg-neutral-800 p-6 sm:p-8 shadow-sm">
                <div className="flex flex-col items-center text-center gap-2">
                    <img src="/logo.png" alt="Eloball" className="h-auto w-44 object-contain dark:hidden" />
                    <img src="/logo-dark.png" alt="Eloball" className="h-auto w-44 object-contain hidden dark:block" />
                    <h1 className="text-xl font-extrabold mt-2">
                        {showCreate ? "Create your player" : "Claim your player"}
                    </h1>
                    <p className="text-sm text-muted-foreground max-w-xs">
                        {showCreate
                            ? "Choose the name you'll appear as on the leaderboard and in matches."
                            : "Pick the player that's you so your matches and ELO link to your account — or create a new one."}
                    </p>
                </div>

                {!showCreate ? (
                    <>
                        {/* Search */}
                        {(players?.length ?? 0) > 6 && (
                            <div className="relative">
                                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                <input
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Search players…"
                                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-background border border-border text-sm outline-none focus:border-primary"
                                />
                            </div>
                        )}

                        {/* Unclaimed players */}
                        <div className="max-h-[44vh] overflow-y-auto -mx-1 px-1 flex flex-col gap-1.5">
                            {isLoading ? (
                                <div className="flex justify-center py-8">
                                    <Loader2 size={24} className="animate-spin text-muted-foreground" />
                                </div>
                            ) : filtered.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-6">
                                    {players?.length === 0 ? "All players are already claimed." : "No players match your search."}
                                </p>
                            ) : (
                                filtered.map((p) => {
                                    const isSel = p.id === selectedId;
                                    return (
                                        <button
                                            key={p.id}
                                            type="button"
                                            onClick={() => setSelectedId(p.id)}
                                            className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all cursor-pointer ${
                                                isSel
                                                    ? "bg-primary/5 border-primary/50 ring-1 ring-primary/40"
                                                    : "bg-background border-border/50 hover:border-primary/40 hover:bg-primary/5"
                                            }`}
                                        >
                                            <span className="flex-1 font-semibold text-sm truncate">{p.name}</span>
                                            <span className="text-xs text-muted-foreground tabular-nums">{p.elo}</span>
                                            {isSel && <Check size={16} className="text-primary shrink-0" />}
                                        </button>
                                    );
                                })
                            )}
                        </div>

                        <div className="flex flex-col gap-3">
                            <Button
                                className="w-full cursor-pointer"
                                disabled={!selected || busy}
                                onClick={handleClaim}
                            >
                                {claiming && <Loader2 size={16} className="animate-spin" />}
                                {selected ? `Claim ${selected.name}` : "Select a player"}
                            </Button>
                            <button
                                type="button"
                                onClick={() => setShowCreate(true)}
                                className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5"
                            >
                                <UserPlus size={14} />
                                Not in the list? Create a new player
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col gap-3">
                        <label className="text-sm font-semibold">Your player name</label>
                        <input
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder="e.g. Magnus"
                            autoFocus
                            className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-sm outline-none focus:border-primary"
                        />
                        <Button className="w-full cursor-pointer" disabled={!newName.trim() || busy} onClick={handleCreate}>
                            {creating && <Loader2 size={16} className="animate-spin" />}
                            Create player
                        </Button>
                        {!noPlayersToClaim && (
                            <button
                                type="button"
                                onClick={() => setShowCreate(false)}
                                className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                            >
                                ← Back to claiming
                            </button>
                        )}
                    </div>
                )}
            </div>

            <button
                onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
                className="mt-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
                <LogOut size={15} />
                Sign out
            </button>
        </div>
    );
}
