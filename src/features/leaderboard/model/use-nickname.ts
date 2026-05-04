import { useCallback, useState } from "react";

const STORAGE_KEY = "leaderboard_nickname";

export function useNickname() {
  const [nickname, setNickname] = useState<string>(
    () => localStorage.getItem(STORAGE_KEY) ?? "",
  );

  const updateNickname = useCallback((value: string) => {
    setNickname(value);
    localStorage.setItem(STORAGE_KEY, value);
  }, []);

  return { nickname, updateNickname };
}
