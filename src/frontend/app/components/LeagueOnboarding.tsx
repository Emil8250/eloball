import { useMemo, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { useDispatch } from "react-redux";
import { toast } from "~/lib/toast";
import { Loader2, LogOut, Search, Shield, UserPlus, Users } from "lucide-react";
import {
    useGetLeaguesQuery,
    useJoinLeagueMutation,
    useCreateLeagueMutation,
} from "../../apis/foosball/foosball";
import { setCurrentLeague } from "~/leagueSlice";
import { Button } from "~/components/ui/button";

export function LeagueOnboarding() {
    const { logout } = useAuth0();
    const dispatch = useDispatch();
    const { data: leagues, isLoading } = useGetLeaguesQuery();
    const [joinLeague, { isLoading: joining }] = useJoinLeagueMutation();
    const [createLeague, { isLoading: creating }] = useCreateLeagueMutation();

    const [query, setQuery] = useState("");
    const [showCreate, setShowCreate] = useState(false);
    const [newName, setNewName] = useState("");

    const busy = joining || creating;

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        const list = leagues ?? [];
        return q ? list.filter((l) => l.name.toLowerCase().includes(q)) : list;
    }, [leagues, query]);

    const handleJoin = async (id: number, name: string) => {
        try {
            await joinLeague(id).unwrap();
            dispatch(setCurrentLeague(id));
            toast.success(`Joined ${name}`);
        } catch {
            toast.error("Couldn't join that league.");
        }
    };

    const handleCreate = async () => {
        const name = newName.trim();
        if (!name) return;
        try {
            const created = await createLeague({ name }).unwrap();
            dispatch(setCurrentLeague(created.id));
            toast.success(`Created ${created.name}`);
        } catch {
            toast.error("Couldn't create your league.");
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center px-6 py-10">
            <div className="w-full max-w-md flex flex-col gap-6 rounded-2xl bg-white dark:bg-neutral-800 p-6 sm:p-8 shadow-sm">
                <div className="flex flex-col items-center text-center gap-2">
                    <img src="/logo.png" alt="Eloball" className="h-auto w-44 object-contain dark:hidden" />
                    <img src="/logo-dark.png" alt="Eloball" className="h-auto w-44 object-contain hidden dark:block" />
                    <h1 className="text-xl font-extrabold mt-2">
                        {showCreate ? "Create a league" : "Join a league"}
                    </h1>
                    <p className="text-sm text-muted-foreground max-w-xs">
                        {showCreate
                            ? "You'll be the owner. Seasons and matches live inside your league."
                            : "Pick a league to play in, or start your own."}
                    </p>
                </div>

                {!showCreate ? (
                    <>
                        {(leagues?.length ?? 0) > 6 && (
                            <div className="relative">
                                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                <input
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Search leagues…"
                                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-background border border-border text-sm outline-none focus:border-primary"
                                />
                            </div>
                        )}

                        <div className="max-h-[44vh] overflow-y-auto -mx-1 px-1 flex flex-col gap-1.5">
                            {isLoading ? (
                                <div className="flex justify-center py-8">
                                    <Loader2 size={24} className="animate-spin text-muted-foreground" />
                                </div>
                            ) : filtered.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-6">
                                    {leagues?.length === 0 ? "No leagues yet — create the first one." : "No leagues match your search."}
                                </p>
                            ) : (
                                filtered.map((l) => (
                                    <div
                                        key={l.id}
                                        className="flex items-center gap-3 rounded-xl border border-border/50 bg-background px-4 py-3"
                                    >
                                        <div className="shrink-0 size-9 rounded-lg bg-muted text-muted-foreground flex items-center justify-center">
                                            <Shield size={18} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-sm truncate">{l.name}</p>
                                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                <Users size={11} />
                                                {l.memberCount} {l.memberCount === 1 ? "member" : "members"}
                                            </p>
                                        </div>
                                        <Button
                                            size="sm"
                                            className="cursor-pointer shrink-0"
                                            disabled={busy}
                                            onClick={() => handleJoin(l.id, l.name)}
                                        >
                                            Join
                                        </Button>
                                    </div>
                                ))
                            )}
                        </div>

                        <button
                            type="button"
                            onClick={() => setShowCreate(true)}
                            className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5"
                        >
                            <UserPlus size={14} />
                            Create your own league
                        </button>
                    </>
                ) : (
                    <div className="flex flex-col gap-3">
                        <label className="text-sm font-semibold">League name</label>
                        <input
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder="e.g. The Foundry - CCD"
                            autoFocus
                            className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-sm outline-none focus:border-primary"
                        />
                        <Button className="w-full cursor-pointer" disabled={!newName.trim() || busy} onClick={handleCreate}>
                            {creating && <Loader2 size={16} className="animate-spin" />}
                            Create league
                        </Button>
                        <button
                            type="button"
                            onClick={() => setShowCreate(false)}
                            className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                        >
                            ← Back to joining
                        </button>
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
