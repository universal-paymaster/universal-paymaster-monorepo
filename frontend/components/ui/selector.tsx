import React from 'react';
import { Dropdown, DropdownTrigger, DropdownMenu, Button } from '@heroui/react';

import { cn } from '@/lib/utils';

type SelectorColor =
  | 'default'
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'danger';

type SelectorVariant =
  | 'solid'
  | 'bordered'
  | 'light'
  | 'flat'
  | 'faded'
  | 'shadow';

type SelectorSelectionMode = 'none' | 'single' | 'multiple';

interface SelectorProps {
  label?: React.ReactNode;
  ariaLabel?: string;
  color?: SelectorColor;
  variant?: SelectorVariant;
  selectionMode?: SelectorSelectionMode;
  children: React.ReactNode; // DropdownItem / DropdownSection, etc.
  onAction?: (key: React.Key) => void;
  buttonClassName?: string;
  disabled?: boolean;
}

export function Selector({
  label = 'Open menu',
  ariaLabel = 'Selector menu',
  color = 'default',
  variant = 'bordered',
  selectionMode = 'single',
  children,
  onAction,
  buttonClassName,
  disabled = false,
}: SelectorProps) {
  return (
    <Dropdown>
      <DropdownTrigger>
        <Button
          variant={variant}
          color={color}
          className={cn(
            'w-full justify-between rounded-xl border border-slate-200/80 bg-white/80 text-slate-900 shadow-sm transition hover:border-slate-300 hover:bg-white focus-visible:ring-2 focus-visible:ring-indigo-200 disabled:cursor-not-allowed disabled:opacity-60',
            buttonClassName
          )}
          disabled={disabled}
        >
          {label}
        </Button>
      </DropdownTrigger>

      <DropdownMenu
        aria-label={ariaLabel}
        color={color}
        variant={variant}
        selectionMode={selectionMode}
        onAction={onAction}
      >
        {children}
      </DropdownMenu>
    </Dropdown>
  );
}
