import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  NavLink,
} from "react-router";

import type { Route } from "./+types/root";
import "../index.css";
import { store } from '~/store'
import { Provider } from "react-redux";
import { Toaster } from "sonner";
import { Trophy, Calendar, Swords } from "lucide-react";
import PlayerProvider from "~/context/PlayerContext/PlayerProvider";

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
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
  { to: "/", label: "Leaderboard", icon: Trophy, activeBg: "bg-amber-500 text-white shadow-md", activeMobile: "bg-amber-500 text-white shadow-sm" },
  { to: "/game", label: "Play", icon: Swords, activeBg: "bg-orange-500 text-white shadow-md", activeMobile: "bg-orange-500 text-white shadow-sm" },
  { to: "/seasons", label: "Seasons", icon: Calendar, activeBg: "bg-emerald-500 text-white shadow-md", activeMobile: "bg-emerald-500 text-white shadow-sm" },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="bg-background text-foreground">
        <Provider store={store}>
          <PlayerProvider>
            <div className="min-h-screen pb-20 md:pb-0 md:pt-16">
              {/* Desktop top nav */}
              <nav className="hidden md:flex fixed top-0 left-0 right-0 z-50 h-24 items-start pt-4 justify-center px-6 bg-gradient-to-b from-background from-50% to-transparent pointer-events-none [&>*]:pointer-events-auto">
                <div className="flex items-center gap-1 bg-muted rounded-2xl p-1">
                    {navItems.map(({ to, label, icon: Icon, activeBg }) => (
                      <NavLink
                        key={to}
                        to={to}
                        end={to === "/"}
                        className={({ isActive }) =>
                          `flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                            isActive
                              ? activeBg
                              : "text-muted-foreground hover:text-foreground hover:bg-background"
                          }`
                        }
                      >
                        <Icon size={18} />
                        {label}
                      </NavLink>
                    ))}
                  </div>
              </nav>

              {/* Page content */}
              <main>{children}</main>

              {/* Mobile bottom tabs */}
              <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50">
                <div className="absolute inset-0 bg-gradient-to-t from-background from-60% to-transparent pointer-events-none" />
                <div className="relative flex items-center justify-around h-16 px-2">
                  {navItems.map(({ to, label, icon: Icon, activeMobile }) => (
                    <NavLink
                      key={to}
                      to={to}
                      end={to === "/"}
                      className={({ isActive }) =>
                        `flex flex-col items-center gap-0.5 w-20 py-1.5 rounded-xl transition-all duration-200 ${
                          isActive
                            ? activeMobile
                            : "text-muted-foreground"
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
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
            <Toaster richColors position="top-center" />
          </PlayerProvider>
        </Provider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
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
