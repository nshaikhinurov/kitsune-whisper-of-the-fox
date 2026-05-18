import { ConvexError } from "convex/values";
import { useMutation } from "convex/react";
import { useCallback, useState } from "react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import type { ReplayAction } from "@engine/engine";

type SubmitStatus = "idle" | "submitting" | "success" | "error";

interface SubmitPayload {
  gameId: string | null;
  nickname: string;
  actions: ReplayAction[];
}

export function useSubmitScore() {
  const submitMutation = useMutation(api.sessions.submitRun);
  const [status, setStatus] = useState<SubmitStatus>("idle");
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const reset = useCallback(() => {
    setStatus("idle");
    setSubmittedId(null);
    setErrorMessage(null);
  }, []);

  const submit = useCallback(
    async (payload: SubmitPayload) => {
      if (status === "submitting") return;

      // No server session (startGame failed → local-seed fallback). The run
      // can't be validated server-side, so there's nothing to submit.
      if (payload.gameId === null) {
        setErrorMessage(
          "Игра шла без сессии сервера — результат не сохранён.",
        );
        setStatus("error");
        return;
      }

      setStatus("submitting");
      setErrorMessage(null);
      try {
        const id = await submitMutation({
          gameId: payload.gameId as Id<"gameSessions">,
          nickname: payload.nickname,
          actions: payload.actions,
        });
        setSubmittedId(id);
        setStatus("success");
      } catch (err) {
        const message =
          err instanceof ConvexError
            ? String(err.data)
            : err instanceof Error
              ? err.message
              : "Не удалось отправить результат";
        setErrorMessage(message);
        setStatus("error");
      }
    },
    [status, submitMutation],
  );

  return { submit, reset, status, submittedId, errorMessage };
}
