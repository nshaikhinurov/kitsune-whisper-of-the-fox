import { useMutation, useQuery } from "convex/react";
import { useCallback, useState } from "react";
import { api } from "../../../../convex/_generated/api";
import { getChatClientId } from "./use-chat-client";

export function useRecentMessages() {
  return useQuery(api.chat.getRecentMessages);
}

export function useSendMessage() {
  const sendMutation = useMutation(api.chat.sendMessage);
  const [error, setError] = useState<string | null>(null);

  const send = useCallback(
    async (nickname: string, content: string) => {
      setError(null);
      try {
        await sendMutation({
          clientId: getChatClientId(),
          nickname,
          content,
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to send message.";
        setError(msg);
        throw e;
      }
    },
    [sendMutation],
  );

  const clearError = useCallback(() => setError(null), []);

  return { send, error, clearError };
}
