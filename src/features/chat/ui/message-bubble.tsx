import { cn } from "~/shared/lib/utils";
import type { Doc } from "../../../../convex/_generated/dataModel";
import { clientColor } from "./client-color";

interface MessageBubbleProps {
  msg: Doc<"chat">;
  isOwn: boolean;
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function MessageBubble({ msg, isOwn }: MessageBubbleProps) {
  return (
    <div className="flex flex-col items-start gap-0.5">
      <div
        className={cn(
          "text-foreground flex max-w-[85%] flex-col gap-1 rounded-2xl rounded-tl-sm p-3 leading-relaxed wrap-break-word",
          isOwn ? "bg-primary/15" : "bg-muted",
        )}
      >
        <span
          className={cn(
            "leading-none font-semibold",
            clientColor(msg.clientId),
          )}
        >
          {msg.nickname}
        </span>
        {msg.content}
        <span className="text-muted-foreground text-right leading-none">
          {formatTime(msg.createdAt)}
        </span>
      </div>
    </div>
  );
}
