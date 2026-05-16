import { Lightbulb, Moon, Settings, Sun, Wind } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useThemeTransitionActive } from "~/features/dark-mode/use-dark-mode";
import { Button } from "~/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/shared/ui/dropdown-menu";
import { Kbd } from "~/shared/ui/kbd";
import { Switch } from "~/shared/ui/switch";

interface SettingsMenuProps {
  zenMode: boolean;
  onZenModeChange: (v: boolean) => void;
  showHints: boolean;
  onShowHintsChange: (v: boolean) => void;
  darkMode: boolean;
  onDarkModeChange: (v: boolean) => void;
  onOpenChange?: (open: boolean) => void;
}

export function SettingsMenu({
  zenMode,
  onZenModeChange,
  showHints,
  onShowHintsChange,
  darkMode,
  onDarkModeChange,
  onOpenChange,
}: SettingsMenuProps) {
  const themeTransitioning = useThemeTransitionActive();
  const [menuOpen, setMenuOpen] = useState(false);
  const pendingMenuCloseRef = useRef(false);

  useEffect(() => {
    if (!themeTransitioning && pendingMenuCloseRef.current) {
      pendingMenuCloseRef.current = false;
      setMenuOpen(false);
    }
  }, [themeTransitioning]);

  const handleMenuOpenChange = (open: boolean) => {
    if (!open && themeTransitioning) {
      pendingMenuCloseRef.current = true;
      return;
    }
    setMenuOpen(open);
    onOpenChange?.(open);
  };

  return (
    <DropdownMenu open={menuOpen} onOpenChange={handleMenuOpenChange}>
      <DropdownMenuTrigger
        render={
          <Button variant="default" size="icon-lg">
            <Settings className="size-6" />
          </Button>
        }
      />
      <DropdownMenuContent
        align="end"
        backdrop
        className="w-auto max-w-none [view-transition-name:settings-menu]"
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel>Настройки</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            closeOnClick={false}
            onClick={() => onZenModeChange(!zenMode)}
            className="justify-between"
          >
            <span className="flex items-center gap-2">
              <Wind className="size-4" />
              Дзен-режим
            </span>
            <span className="flex items-center gap-2">
              <Kbd className="hidden sm:inline-flex">Z</Kbd>
              <Switch
                checked={zenMode}
                onCheckedChange={onZenModeChange}
                onClick={(e) => e.stopPropagation()}
              />
            </span>
          </DropdownMenuItem>
          <DropdownMenuItem
            closeOnClick={false}
            onClick={() => onShowHintsChange(!showHints)}
            className="justify-between"
          >
            <span className="flex items-center gap-2">
              <Lightbulb className="size-4" />
              Показывать подсказки
            </span>
            <span className="flex items-center gap-2">
              <Kbd className="hidden sm:inline-flex">H</Kbd>
              <Switch
                checked={showHints}
                onCheckedChange={onShowHintsChange}
                onClick={(e) => e.stopPropagation()}
              />
            </span>
          </DropdownMenuItem>
          <DropdownMenuItem
            closeOnClick={false}
            disabled={themeTransitioning}
            onClick={() => onDarkModeChange(!darkMode)}
            className="justify-between"
          >
            <span className="flex items-center gap-2">
              {darkMode ? (
                <Moon className="size-4" />
              ) : (
                <Sun className="size-4" />
              )}
              Тёмная тема
            </span>
            <span className="flex items-center gap-2">
              <Kbd className="hidden sm:inline-flex">D</Kbd>
              <Switch
                checked={darkMode}
                readOnly={themeTransitioning}
                onCheckedChange={onDarkModeChange}
                onClick={(e) => e.stopPropagation()}
              />
            </span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
