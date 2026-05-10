const CLIENT_COLORS = [
  "text-red-700 dark:text-red-300",
  "text-orange-700 dark:text-orange-300",
  "text-amber-700 dark:text-amber-300",
  "text-yellow-700 dark:text-yellow-300",
  "text-lime-700 dark:text-lime-300",
  "text-green-700 dark:text-green-300",
  "text-emerald-700 dark:text-emerald-300",
  "text-teal-700 dark:text-teal-300",
  "text-cyan-700 dark:text-cyan-300",
  "text-sky-700 dark:text-sky-300",
  "text-blue-700 dark:text-blue-300",
  "text-indigo-700 dark:text-indigo-300",
  "text-violet-700 dark:text-violet-300",
  "text-purple-700 dark:text-purple-300",
  "text-fuchsia-700 dark:text-fuchsia-300",
  "text-pink-700 dark:text-pink-300",
  "text-rose-700 dark:text-rose-300",
] as const;

export function clientColor(clientId: string): string {
  let hash = 0;
  for (let i = 0; i < clientId.length; i++) {
    hash = (hash * 31 + clientId.charCodeAt(i)) >>> 0;
  }
  return CLIENT_COLORS[hash % CLIENT_COLORS.length];
}
