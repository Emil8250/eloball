import { useAuth0 } from "@auth0/auth0-react";
import { useState } from "react";
import {
    Clock,
    Loader2,
    LogOut,
    Mail,
    ShieldAlert,
    ShieldCheck,
} from "lucide-react";

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
