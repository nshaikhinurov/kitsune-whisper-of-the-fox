import { cn } from "~/shared/lib/utils";

function StarIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 1054.41 1177.69"
      className={cn("shrink-0", className)}
      aria-hidden="true"
    >
      <path
        fill="var(--color-primary)"
        d="M1042.13,604.68c-340.31,87.59-421.92,177.77-498.9,559.88-3.53,17.51-28.54,17.51-32.06,0-76.98-382.11-158.59-472.29-498.9-559.88-16.36-4.21-16.36-27.46,0-31.67C352.58,485.42,434.19,395.24,511.17,13.13c3.53-17.51,28.54-17.51,32.06,0,76.98,382.11,158.59,472.29,498.9,559.88,16.36,4.21,16.36,27.46,0,31.67Z"
      />
    </svg>
  );
}

export { StarIcon };
