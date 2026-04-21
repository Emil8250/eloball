import { useAuth0 } from "@auth0/auth0-react";
import { Loader2, LogOut, Mail } from "lucide-react";

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

export default function Profile() {
    const { user, isLoading, logout } = useAuth0();

    if (isLoading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <Loader2 size={32} className="animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!user) return null;

    const provider = providerLabel(user.sub);

    return (
        <div className="max-w-2xl mx-auto px-4 py-6">
            <div className="text-center mb-8 animate-slide-up">
                {user.picture && (
                    <img
                        src={user.picture}
                        alt={user.name ?? "Avatar"}
                        referrerPolicy="no-referrer"
                        className="size-20 rounded-full object-cover mx-auto mb-4 border border-border/50 shadow-sm"
                    />
                )}
                <h1 className="text-2xl md:text-3xl font-extrabold">
                    {user.name ?? user.nickname ?? "Player"}
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Signed in with {provider}
                </p>
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
                        <span className="ml-auto shrink-0 text-[10px] font-bold uppercase tracking-wider bg-muted text-muted-foreground rounded-full px-2 py-0.5">
                            {provider}
                        </span>
                    </div>
                </section>

                <div
                    className="mt-2 flex justify-center animate-slide-up"
                    style={{ animationDelay: "120ms" }}
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
        </div>
    );
}
