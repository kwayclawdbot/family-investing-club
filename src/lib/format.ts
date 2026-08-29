/** Shared display formatters (client-safe). */
export const fmtPeople = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, "")}K` : String(n));
