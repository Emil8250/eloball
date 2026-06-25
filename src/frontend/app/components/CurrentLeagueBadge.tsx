import { Shield } from "lucide-react";
import { useGetMyLeaguesQuery } from "../../apis/foosball/foosball";
import { useCurrentLeague } from "~/lib/useCurrentLeague";

/**
 * Chip showing which league the current page is scoped to.
 * `inline` renders just the pill (for placing next to other elements);
 * otherwise it's centered with bottom margin for use at the top of a page.
 */
export function CurrentLeagueBadge({ inline = false }: { inline?: boolean }) {
    const currentLeagueId = useCurrentLeague();
    const { data: myLeagues } = useGetMyLeaguesQuery();
    const league = myLeagues?.find((l) => l.id === currentLeagueId);
    if (!league) return null;
    const pill = (
        <span className="inline-flex items-center gap-2 text-sm font-bold bg-sky-500/10 text-sky-600 dark:text-sky-400 rounded-full px-4 py-1.5">
            <Shield size={14} />
            {league.name}
        </span>
    );
    if (inline) return pill;
    return <div className="flex justify-center mb-4">{pill}</div>;
}
