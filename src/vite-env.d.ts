/// <reference types="vite/client" />

interface Window {
  Telegram?: {
    WebApp?: {
      ready(): void;
      expand(): void;
      disableVerticalSwipes?(): void;
      enableClosingConfirmation?(): void;
    };
  };
}
