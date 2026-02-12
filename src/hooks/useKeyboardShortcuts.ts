import { useEffect } from 'react';

interface KeyboardShortcutOptions {
  recommendationCount: number;
  focusedIndex: number;
  onFocusChange: (index: number) => void;
  onSelectFocused: () => void;
  onDeselect: () => void;
  onNewBoard: () => void;
}

export function useKeyboardShortcuts({
  recommendationCount,
  focusedIndex,
  onFocusChange,
  onSelectFocused,
  onDeselect,
  onNewBoard,
}: KeyboardShortcutOptions) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Don't fire when user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key) {
        case 'ArrowUp': {
          e.preventDefault();
          const next = focusedIndex <= 0 ? recommendationCount - 1 : focusedIndex - 1;
          onFocusChange(next);
          break;
        }
        case 'ArrowDown': {
          e.preventDefault();
          const next = focusedIndex >= recommendationCount - 1 ? 0 : focusedIndex + 1;
          onFocusChange(next);
          break;
        }
        case 'Enter': {
          e.preventDefault();
          onSelectFocused();
          break;
        }
        case 'Escape': {
          e.preventDefault();
          onDeselect();
          break;
        }
        case 'n':
        case 'N': {
          // Only trigger if no modifier keys (avoid browser shortcuts)
          if (!e.metaKey && !e.ctrlKey && !e.altKey) {
            e.preventDefault();
            onNewBoard();
          }
          break;
        }
        default: {
          // 1–5: jump to that recommendation rank
          const rank = parseInt(e.key, 10);
          if (rank >= 1 && rank <= 5 && rank <= recommendationCount) {
            e.preventDefault();
            onFocusChange(rank - 1);
          }
          break;
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusedIndex, recommendationCount, onFocusChange, onSelectFocused, onDeselect, onNewBoard]);
}
