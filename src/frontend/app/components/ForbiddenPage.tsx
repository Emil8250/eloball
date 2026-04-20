import {useAuth0} from "@auth0/auth0-react";
import {LogOut} from "lucide-react";

export function ForbiddenPage() {
    const {logout} = useAuth0();
    return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-8 px-6">
            <div className="flex flex-col items-center gap-3">
                <img src="/logo.png" alt="Eloball" className="h-20 w-20 object-contain dark:hidden"/>
                <img src="/logo-dark.png" alt="Eloball" className="h-20 w-20 object-contain hidden dark:block"/>
                <h1 className="text-3xl font-extrabold tracking-tight">No access</h1>
                <p className="text-muted-foreground text-center max-w-xs">
                    You're logged in, but your account doesn't have permission to use Eloball.
                    Ask an admin to grant you access, or log in with a different account.
                </p>
            </div>
            <button
                onClick={() => logout({logoutParams: {returnTo: window.location.origin}})}
                className="flex items-center justify-center gap-2 w-full max-w-xs py-3 rounded-xl border border-border font-semibold text-sm transition-colors hover:bg-muted"
            >
                <LogOut size={16}/>
                Log out
            </button>
        </div>
    );
}
