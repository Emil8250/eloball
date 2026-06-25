// Quirky, funny, slightly-cyber random league name generator.
// Powers the "shuffle" dice button on the create-league inputs (onboarding + profile).

const ADJECTIVES = [
    "Quantum", "Cyber", "Neon", "Turbo", "Glitched", "Overclocked", "Rogue",
    "Encrypted", "Holographic", "Synthetic", "Chrome", "Pixelated", "Radioactive",
    "Caffeinated", "Feral", "Unhinged", "Sentient", "Bootleg", "Galactic", "Greasy",
    "Wireless", "Buffering", "Corrupted", "Laser", "Plasma", "Disco",
];

const NOUNS = [
    "Goblins", "Cyborgs", "Bytes", "Toasters", "Raccoons", "Ninjas", "Wizards",
    "Hamsters", "Androids", "Gremlins", "Bandits", "Robots", "Pugs", "Hackers",
    "Llamas", "Vandals", "Ducks", "Phantoms", "Mechs", "Yetis", "Pixels",
    "Daemons", "Squids", "Crayons", "Warlords", "Kittens",
];

const SUFFIXES = [
    "Syndicate", "Collective", "Mainframe", "Protocol", "Network", "Coalition",
    "Dynasty", "Uprising", "Brigade", "Cartel", "Cluster", "Matrix", ".exe", "9000",
];

function pick<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

/** e.g. "Cyber Goblins Syndicate", "The Overclocked Toasters", "Glitched Raccoons.exe". */
export function randomLeagueName(): string {
    const base = `${pick(ADJECTIVES)} ${pick(NOUNS)}`;
    const roll = Math.random();
    // ~35% short ("The Caffeinated Hamsters"), otherwise tack on a cyber suffix.
    if (roll < 0.35) return `The ${base}`;
    const suffix = pick(SUFFIXES);
    // ".exe" / "9000" read better glued straight on without a space.
    return suffix === ".exe" || suffix === "9000" ? `${base}${suffix}` : `${base} ${suffix}`;
}
