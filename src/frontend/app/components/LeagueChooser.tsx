import { useDispatch } from "react-redux";
import { Check, Shield, Users } from "lucide-react";
import { useGetMyLeaguesQuery } from "../../apis/foosball/foosball";
import { setCurrentLeague } from "~/leagueSlice";

/** Shown when the user belongs to more than one league and hasn't picked one yet. */
export function LeagueChooser() {
    const dispatch = useDispatch();
    const { data: myLeagues } = useGetMyLeaguesQuery();

    return (
        <div className="min-h-screen flex flex-col items-center justify-center px-6 py-10">
            <div className="w-full max-w-md flex flex-col gap-6 rounded-2xl bg-white dark:bg-neutral-800 p-6 sm:p-8 shadow-sm">
                <div className="flex flex-col items-center text-center gap-2">
                    <img src="/logo.png" alt="Eloball" className="h-auto w-44 object-contain dark:hidden" />
                    <img src="/logo-dark.png" alt="Eloball" className="h-auto w-44 object-contain hidden dark:block" />
                    <h1 className="text-xl font-extrabold mt-2">Choose a league</h1>
                    <p className="text-sm text-muted-foreground max-w-xs">
                        Which league do you want to open? You can switch anytime in your profile.
                    </p>
                </div>

                <div className="max-h-[55vh] overflow-y-auto -mx-1 px-1 flex flex-col gap-1.5">
                    {(myLeagues ?? []).map((l) => (
                        <button
                            key={l.id}
                            type="button"
                            onClick={() => dispatch(setCurrentLeague(l.id))}
                            className="flex items-center gap-3 rounded-xl border border-border/50 bg-background px-4 py-3 text-left transition-all cursor-pointer hover:border-primary/40 hover:bg-primary/5"
                        >
                            <div className="shrink-0 size-9 rounded-lg bg-muted text-muted-foreground flex items-center justify-center">
                                <Shield size={18} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm truncate">{l.name}</p>
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Users size={11} />
                                    {l.memberCount} {l.memberCount === 1 ? "member" : "members"}
                                    {l.role === "Owner" && <span className="ml-1 text-sky-500 font-semibold">· Owner</span>}
                                </p>
                            </div>
                            <Check size={16} className="text-muted-foreground/40 shrink-0" />
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
