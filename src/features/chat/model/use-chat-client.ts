import { useCallback } from "react";
import { useLocalStorage } from "usehooks-ts";

const CLIENT_ID_KEY = "chat_client_id";
const NICKNAME_KEY = "chat_nickname";

function getOrCreateClientId(): string {
  let id = localStorage.getItem(CLIENT_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(CLIENT_ID_KEY, id);
  }
  return id;
}

function regenerateClientId(): string {
  const id = crypto.randomUUID();
  localStorage.setItem(CLIENT_ID_KEY, id);
  return id;
}

export function getChatClientId(): string {
  return getOrCreateClientId();
}

export function useChatNickname() {
  const [nickname, setNicknameState, removeNickname] = useLocalStorage<
    string | null
  >(NICKNAME_KEY, null);

  const setNickname = useCallback(
    (name: string) => {
      regenerateClientId();
      setNicknameState(name);
    },
    [setNicknameState],
  );

  const clearNickname = useCallback(() => {
    removeNickname();
  }, [removeNickname]);

  return { nickname, setNickname, clearNickname };
}
