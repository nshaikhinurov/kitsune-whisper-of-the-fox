import { cn } from "~/shared/lib/utils";

function HeartIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 46.46 43.51"
      className={cn("shrink-0", className)}
      aria-hidden="true"
    >
      <path
        fill="oklch(0.6005 0.1597 18.62)"
        d="M23.23,43.51L2.68,18.92C-1.4,14.04-.75,6.77,4.14,2.68c4.89-4.08,12.16-3.43,16.24,1.45l2.85,3.41,2.85-3.41c4.08-4.89,11.35-5.54,16.24-1.45,4.89,4.08,5.54,11.35,1.45,16.24l-20.55,24.59Z"
      />
    </svg>
  );
}

export { HeartIcon };
