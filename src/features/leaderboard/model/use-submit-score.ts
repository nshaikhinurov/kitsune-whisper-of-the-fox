import { useMutation } from "convex/react";
import { useCallback, useState } from "react";
import { api } from "../../../../convex/_generated/api";
import type { GameMode } from "../../../shared/types/leaderboard";

type SubmitStatus = "idle" | "submitting" | "success" | "error";

interface SubmitPayload {
  nickname: string;
  score: number;
  stars: number;
  level: number;
  mode: GameMode;
}

export function useSubmitScore() {
  const submitMutation = useMutation(api.leaderboard.submitScore);
  const [status, setStatus] = useState<SubmitStatus>("idle");
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const submit = useCallback(
    async (payload: SubmitPayload) => {
      if (status === "submitting") return;
      setStatus("submitting");
      setErrorMessage(null);
      try {
        const id = await submitMutation(payload);
        setSubmittedId(id);
        setStatus("success");
      } catch (err) {
        setErrorMessage(
          err instanceof Error ? err.message : "Failed to submit",
        );
        setStatus("error");
      }
    },
    [status, submitMutation],
  );

  return { submit, status, submittedId, errorMessage };
}
