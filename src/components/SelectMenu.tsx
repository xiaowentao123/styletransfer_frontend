import { useEffect, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";

type Option = {
  label: string;
  value: string;
};

type SelectMenuProps = {
  value: string;
  options: Option[];
  onChange: (value: string) => void;
};

export function SelectMenu({ value, options, onChange }: SelectMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const selected = options.find((option) => option.value === value) ?? options[0];

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    window.addEventListener("mousedown", handleClick);
    return () => window.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="select-menu" ref={rootRef}>
      <button
        type="button"
        className={open ? "modern-select modern-select-open" : "modern-select"}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setOpen((current) => !current);
        }}
      >
        <span>{selected.label}</span>
        <span className={open ? "select-menu-icon select-menu-icon-open" : "select-menu-icon"} aria-hidden="true">
          <svg viewBox="0 0 20 20" fill="none">
            <path
              d="M5 7.5L10 12.5L15 7.5"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>
      {open ? (
        <div className="select-menu-list">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              className={option.value === value ? "select-menu-option selected" : "select-menu-option"}
              onClick={(event: ReactMouseEvent<HTMLButtonElement>) => {
                event.preventDefault();
                event.stopPropagation();
                onChange(option.value);
                setOpen(false);
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
