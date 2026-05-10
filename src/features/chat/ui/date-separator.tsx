interface DateSeparatorProps {
  label: string;
}

export function DateSeparator({ label }: DateSeparatorProps) {
  return (
    <div className="my-1 flex items-center justify-center">
      <span className="text-muted-foreground bg-muted rounded-full px-3 py-0.5 text-[10px] font-medium">
        {label}
      </span>
    </div>
  );
}
