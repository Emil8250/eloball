import {
    isRouteErrorResponse,
    Links,
    Meta,
    Outlet,
    Scripts,
    ScrollRestoration,
    NavLink,
    useSearchParams,
} from "react-router";
import type {Route} from "./+types/root";
import "../index.css";
import {store, type RootState} from '~/store'
import {Provider, useDispatch, useSelector} from "react-redux";
import {Toaster} from "sonner";
import {Trophy, Calendar, Swords, BarChart3, Loader2} from "lucide-react";
import PlayerProvider from "~/context/PlayerContext/PlayerProvider";
import {Auth0Provider, useAuth0} from "@auth0/auth0-react";
import {setTokenGetter} from "../apis/foosball/foosball";
import {useEffect} from "react";
import {setForbidden} from "~/authSlice";
import {ForbiddenPage} from "~/components/ForbiddenPage";

const AUTH0_AUDIENCE = "https://api.billigeterninger.dk/";

export const links: Route.LinksFunction = () => [
    {rel: "preconnect", href: "https://fonts.googleapis.com"},
    {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
    },
    {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800;900&display=swap",
    },
];

const navItems = [
    {
        to: "/",
        label: "Leaderboard",
        icon: Trophy,
        activeBg: "bg-amber-500 text-white shadow-md",
        activeMobile: "bg-amber-500 text-white shadow-sm"
    },
    {
        to: "/game",
        label: "Play",
        icon: Swords,
        activeBg: "bg-orange-500 text-white shadow-md",
        activeMobile: "bg-orange-500 text-white shadow-sm"
    },
    {
        to: "/seasons",
        label: "Seasons",
        icon: Calendar,
        activeBg: "bg-emerald-500 text-white shadow-md",
        activeMobile: "bg-emerald-500 text-white shadow-sm"
    },
    {
        to: "/stats",
        label: "Stats",
        icon: BarChart3,
        activeBg: "bg-violet-500 text-white shadow-md",
        activeMobile: "bg-violet-500 text-white shadow-sm"
    },
];

function LoginPage() {
    const {loginWithRedirect, isLoading} = useAuth0();
    const [searchParams] = useSearchParams();

    const authError = searchParams.get("error");
    const authErrorDescription = searchParams.get("error_description");

    return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-8 px-6">
            <div className="flex flex-col items-center gap-3">
                <img src="/logo.png" alt="Eloball" className="h-20 w-20 object-contain dark:hidden"/>
                <img src="/logo-dark.png" alt="Eloball" className="h-20 w-20 object-contain hidden dark:block"/>
                <h1 className="text-3xl font-extrabold tracking-tight">Eloball</h1>
                <p className="text-muted-foreground text-center max-w-xs">
                    Track your foosball ELO rating and compete across seasons.
                </p>
            </div>

            {authError && authErrorDescription && (
                <div className="w-full max-w-xs rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
                    <p className="font-semibold">Login failed</p>
                    <p className="mt-1">{authErrorDescription}</p>
                </div>
            )}

            <div className="flex flex-col gap-3 w-full max-w-xs">
                <button
                    onClick={() => loginWithRedirect()}
                    disabled={isLoading}
                    className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                    {isLoading && <Loader2 size={16} className="animate-spin"/>}
                    Log in
                </button>
                <button
                    onClick={() => loginWithRedirect({authorizationParams: {screen_hint: "signup"}})}
                    disabled={isLoading}
                    className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-border font-semibold text-sm transition-colors hover:bg-muted disabled:opacity-50"
                >
                    Sign up
                </button>
            </div>
        </div>
    );
}

function AppShell({children}: { children: React.ReactNode }) {
    const {isAuthenticated, isLoading, getAccessTokenSilently} = useAuth0();
    const forbidden = useSelector((s: RootState) => s.auth.forbidden);
    const dispatch = useDispatch();

    useEffect(() => {
        if (!isAuthenticated) dispatch(setForbidden(false));
    }, [isAuthenticated, dispatch]);

    if (isAuthenticated) {
        setTokenGetter(() => getAccessTokenSilently({authorizationParams: {audience: AUTH0_AUDIENCE}}));
    } else {
        setTokenGetter(null);
    }

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 size={32} className="animate-spin text-muted-foreground"/>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <LoginPage/>;
    }

    if (forbidden) {
        return <ForbiddenPage/>;
    }

    return (
        <div className="min-h-screen pb-20 md:pb-0 md:pt-16">
            {/* Desktop top nav */}
            <nav
                className="hidden md:flex fixed top-0 left-0 right-0 z-50 h-24 items-start pt-4 justify-center px-6 bg-gradient-to-b from-background from-50% to-transparent pointer-events-none [&>*]:pointer-events-auto">
                <div className="flex items-center gap-1 bg-muted rounded-2xl p-1">
                    {navItems.map(({to, label, icon: Icon, activeBg}) => (
                        <NavLink
                            key={to}
                            to={to}
                            end={to === "/"}
                            className={({isActive}) =>
                                `flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                                    isActive
                                        ? activeBg
                                        : "text-muted-foreground hover:text-foreground hover:bg-background"
                                }`
                            }
                        >
                            <Icon size={18}/>
                            {label}
                        </NavLink>
                    ))}
                </div>
            </nav>

            {/* Page content */}
            <main>{children}</main>

            {/* Mobile bottom tabs */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50">
                <div
                    className="absolute inset-0 bg-gradient-to-t from-background from-60% to-transparent pointer-events-none"/>
                <div className="relative flex items-center justify-around h-16 px-2">
                    {navItems.map(({to, label, icon: Icon, activeMobile}) => (
                        <NavLink
                            key={to}
                            to={to}
                            end={to === "/"}
                            className={({isActive}) =>
                                `flex flex-col items-center gap-0.5 w-20 py-1.5 rounded-xl transition-all duration-200 ${
                                    isActive
                                        ? activeMobile
                                        : "text-muted-foreground"
                                }`
                            }
                        >
                            {({isActive}) => (
                                <>
                                    <Icon size={20} strokeWidth={isActive ? 2.5 : 2}/>
                                    <span className="text-[10px] font-semibold">
                                        {label}
                                    </span>
                                </>
                            )}
                        </NavLink>
                    ))}
                </div>
            </nav>
        </div>
    );
}

export function Layout({children}: { children: React.ReactNode }) {
    return (
        <Auth0Provider
            domain="dev-82kcp8l6j263vhyk.eu.auth0.com"
            clientId="26B0Dqdn2tZ3QZl3fB6xfZQKjGDnY41W"
            authorizationParams={{
                redirect_uri: import.meta.env.VITE_DOMAIN,
                audience: AUTH0_AUDIENCE,
            }}
        >
            <html lang="en">
            <head>
                <meta charSet="utf-8"/>
                <meta name="viewport" content="width=device-width, initial-scale=1"/>
                <Meta/>
                <Links/>
            </head>
            <body className="bg-background text-foreground">
            <Provider store={store}>
                <PlayerProvider>
                    <AppShell>{children}</AppShell>
                    <Toaster richColors position="top-center"/>
                </PlayerProvider>
            </Provider>
            <ScrollRestoration/>
            <Scripts/>
            </body>
            </html>
        </Auth0Provider>
    );
}

export default function App() {
    return <Outlet/>;
}

export function ErrorBoundary({error}: Route.ErrorBoundaryProps) {
    let message = "Oops!";
    let details = "An unexpected error occurred.";
    let stack: string | undefined;

    if (isRouteErrorResponse(error)) {
        message = error.status === 404 ? "404" : "Error";
        details =
            error.status === 404
                ? "The requested page could not be found."
                : error.statusText || details;
    } else if (import.meta.env.DEV && error && error instanceof Error) {
        details = error.message;
        stack = error.stack;
    }

    return (
        <main className="pt-16 p-4 container mx-auto">
            <h1 className="text-2xl font-bold">{message}</h1>
            <p className="mt-2">{details}</p>
            {stack && (
                <pre className="w-full p-4 overflow-x-auto mt-4 text-sm bg-muted rounded-lg">
          <code>{stack}</code>
        </pre>
            )}
        </main>
    );
}
