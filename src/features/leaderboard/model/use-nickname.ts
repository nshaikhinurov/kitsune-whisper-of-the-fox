import { useCallback } from "react";
import { useLocalStorage } from "usehooks-ts";

const STORAGE_KEY = "leaderboard_nickname";

export function useNickname() {
  const [nickname, setNickname] = useLocalStorage(STORAGE_KEY, "");

  const updateNickname = useCallback(
    (value: string) => {
      setNickname(value);
    },
    [setNickname],
  );

  return { nickname, updateNickname };
}
