import { SendHorizontal } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "~/shared/lib/utils";
import { Button } from "~/shared/ui/button";
import { Input } from "~/shared/ui/input";
import { Sheet, SheetContent, SheetTitle } from "~/shared/ui/sheet";
import { Textarea } from "~/shared/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "~/shared/ui/tooltip";
import { useRecentMessages, useSendMessage } from "../model/use-chat";
import { getChatClientId, useChatNickname } from "../model/use-chat-client";
import { clientColor } from "./client-color";
import { DateSeparator } from "./date-separator";
import { MessageBubble } from "./message-bubble";

const MAX_LENGTH = 280;

function formatDateBadge(ts: number) {
  const d = new Date(ts);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
  if (sameDay(d, today)) return "Today";
  if (sameDay(d, yesterday)) return "Yesterday";
  return d.toLocaleDateString([], { month: "long", day: "numeric" });
}

function getDateKey(ts: number) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

interface ChatPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChatPanel({ open, onOpenChange }: ChatPanelProps) {
  const messages = useRecentMessages();
  const { send, error, clearError } = useSendMessage();
  const { nickname, setNickname, clearNickname } = useChatNickname();

  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [nicknameInput, setNicknameInput] = useState("");

  const listRef = useRef<HTMLDivElement>(null);
  const myClientId = getChatClientId();

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  async function handleSend() {
    if (!nickname || !draft.trim() || sending) return;
    setSending(true);
    try {
      await send(nickname, draft.trim());
      setDraft("");
    } catch {
      // error displayed via `error` state
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleSetNickname(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = nicknameInput.trim();
    if (trimmed.length < 1 || trimmed.length > 24) return;
    setNickname(trimmed);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-80 flex-col gap-0 text-base">
        <SheetTitle className="border-border flex h-16 items-center border-b p-4">
          Live Chat
        </SheetTitle>
        <div className="flex h-full flex-1 flex-col overflow-hidden">
          <div
            ref={listRef}
            className="flex flex-1 flex-col gap-2 overflow-y-auto px-4 py-3"
          >
            {messages === undefined && (
              <p className="text-muted-foreground animate-pulse py-8 text-center text-sm">
                Loading…
              </p>
            )}
            {messages?.length === 0 && (
              <p className="text-muted-foreground py-8 text-center text-sm">
                No messages yet — say hello!
              </p>
            )}
            {messages?.map((msg, i) => {
              const isOwn = msg.clientId === myClientId;
              const dateKey = getDateKey(msg.createdAt);
              const prevDateKey =
                i > 0 ? getDateKey(messages[i - 1].createdAt) : null;
              const showDateBadge = dateKey !== prevDateKey;
              return (
                <div key={msg._id} className="flex flex-col gap-2">
                  {showDateBadge && (
                    <DateSeparator label={formatDateBadge(msg.createdAt)} />
                  )}
                  <MessageBubble msg={msg} isOwn={isOwn} />
                </div>
              );
            })}
          </div>

          {error && (
            <div className="bg-destructive/10 text-destructive mx-4 mb-2 flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-xs">
              <span>{error}</span>
              <button
                onClick={clearError}
                className="shrink-0 font-medium hover:underline"
              >
                Dismiss
              </button>
            </div>
          )}

          {nickname === null ? (
            <form
              onSubmit={handleSetNickname}
              className="border-border flex flex-col gap-2 border-t px-4 py-3"
            >
              <p className="text-muted-foreground">
                Choose a nickname to start chatting:
              </p>
              <div className="flex items-center gap-2">
                <Input
                  value={nicknameInput}
                  onChange={(e) => setNicknameInput(e.target.value)}
                  placeholder="Your nickname"
                  maxLength={24}
                  className="flex-1"
                  autoFocus
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={nicknameInput.trim().length === 0}
                >
                  Set
                </Button>
              </div>
            </form>
          ) : (
            <div className="border-border flex flex-col gap-2 border-t px-4 py-3">
              <span className="text-muted-foreground">
                Chatting as{" "}
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button
                        variant="link"
                        size="sm"
                        className={cn("font-semibold", clientColor(myClientId))}
                        onClick={clearNickname}
                      >
                        {nickname}
                      </Button>
                    }
                  />
                  <TooltipContent>Change nickname</TooltipContent>
                </Tooltip>
              </span>
              <div className="relative">
                <Textarea
                  value={draft}
                  onChange={(e) => {
                    if (e.target.value.length <= MAX_LENGTH)
                      setDraft(e.target.value);
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Say something… (Enter to send)"
                  rows={3}
                  className="py-2 pr-10 text-sm"
                  disabled={sending}
                />
                <Button
                  size="icon-sm"
                  variant="ghost"
                  className="absolute right-1.5 bottom-1.5"
                  onClick={handleSend}
                  disabled={!draft.trim() || sending}
                >
                  <SendHorizontal className="size-4" />
                </Button>
              </div>
              <span
                className={cn(
                  "text-right text-[10px] tabular-nums",
                  draft.length > MAX_LENGTH - 20
                    ? "text-destructive"
                    : "text-muted-foreground",
                )}
              >
                {draft.length}/{MAX_LENGTH}
              </span>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
