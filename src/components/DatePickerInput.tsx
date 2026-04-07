import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslate } from "../context/AppContext";

type DatePickerInputProps = {
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
  placeholder: string;
};

type PickerView = "day" | "month" | "year";

const monthLabels = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];

function formatDateValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getDateFromValue(value: string) {
  if (!value) {
    return new Date();
  }

  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function DatePickerInput({ value, onChange, ariaLabel, placeholder }: DatePickerInputProps) {
  const { t } = useTranslate();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<PickerView>("day");
  const [viewDate, setViewDate] = useState(() => getDateFromValue(value));
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (value) {
      setViewDate(getDateFromValue(value));
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setView("day");
      }
    };

    window.addEventListener("mousedown", handleClickOutside);
    return () => window.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const calendarDays = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const leadingDays = firstDay.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    return [
      ...Array.from({ length: leadingDays }, () => null),
      ...Array.from({ length: daysInMonth }, (_, index) => new Date(year, month, index + 1)),
    ];
  }, [viewDate]);

  const yearOptions = useMemo(() => {
    const startYear = viewDate.getFullYear() - 7;
    return Array.from({ length: 15 }, (_, index) => startYear + index);
  }, [viewDate]);

  const selectedValue = value;
  const currentYear = viewDate.getFullYear();
  const currentMonth = viewDate.getMonth();

  const closePicker = () => {
    setOpen(false);
    setView("day");
  };

  return (
    <div className="date-picker" ref={wrapperRef}>
      <button
        type="button"
        className={value ? "date-picker-trigger date-picker-trigger-active" : "date-picker-trigger"}
        aria-label={ariaLabel}
        onClick={() => setOpen((next) => !next)}
      >
        {value || placeholder}
      </button>

      {open ? (
        <div className="date-picker-popover">
          <div className="date-picker-head">
            <div className="date-picker-nav-group">
              <button
                type="button"
                className="date-picker-nav"
                onClick={() =>
                  setViewDate((current) => new Date(current.getFullYear() - 1, current.getMonth(), 1))
                }
              >
                <svg viewBox="0 0 20 20" fill="none">
                  <path
                    d="M11 5 6 10l5 5M15 5l-5 5 5 5"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              <button
                type="button"
                className="date-picker-nav"
                onClick={() =>
                  setViewDate((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))
                }
              >
                <svg viewBox="0 0 20 20" fill="none">
                  <path
                    d="M12 5 7 10l5 5"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>

            <div className="date-picker-title">
              <button type="button" onClick={() => setView("year")}>
                {currentYear}
              </button>
              <button type="button" onClick={() => setView("month")}>
                {monthLabels[currentMonth]}
              </button>
            </div>

            <div className="date-picker-nav-group">
              <button
                type="button"
                className="date-picker-nav"
                onClick={() =>
                  setViewDate((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))
                }
              >
                <svg viewBox="0 0 20 20" fill="none">
                  <path
                    d="m8 5 5 5-5 5"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              <button
                type="button"
                className="date-picker-nav"
                onClick={() =>
                  setViewDate((current) => new Date(current.getFullYear() + 1, current.getMonth(), 1))
                }
              >
                <svg viewBox="0 0 20 20" fill="none">
                  <path
                    d="m5 5 5 5-5 5M9 5l5 5-5 5"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          </div>

          {view === "day" ? (
            <>
              <div className="date-picker-weekdays">
                {["S", "M", "T", "W", "T", "F", "S"].map((item, index) => (
                  <span key={`${item}-${index}`}>{item}</span>
                ))}
              </div>

              <div className="date-picker-grid">
                {calendarDays.map((date, index) =>
                  date ? (
                    <button
                      key={formatDateValue(date)}
                      type="button"
                      className={
                        selectedValue === formatDateValue(date)
                          ? "date-picker-day date-picker-day-selected"
                          : "date-picker-day"
                      }
                      onClick={() => {
                        onChange(formatDateValue(date));
                        closePicker();
                      }}
                    >
                      {date.getDate()}
                    </button>
                  ) : (
                    <span key={`empty-${index}`} className="date-picker-empty" />
                  ),
                )}
              </div>
            </>
          ) : null}

          {view === "month" ? (
            <div className="date-picker-option-grid">
              {monthLabels.map((monthLabel, index) => (
                <button
                  key={monthLabel}
                  type="button"
                  className={
                    currentMonth === index
                      ? "date-picker-option date-picker-option-selected"
                      : "date-picker-option"
                  }
                  onClick={() => {
                    setViewDate((current) => new Date(current.getFullYear(), index, 1));
                    setView("day");
                  }}
                >
                  {monthLabel}
                </button>
              ))}
            </div>
          ) : null}

          {view === "year" ? (
            <div className="date-picker-option-grid">
              {yearOptions.map((year) => (
                <button
                  key={year}
                  type="button"
                  className={
                    currentYear === year
                      ? "date-picker-option date-picker-option-selected"
                      : "date-picker-option"
                  }
                  onClick={() => {
                    setViewDate((current) => new Date(year, current.getMonth(), 1));
                    setView("month");
                  }}
                >
                  {year}
                </button>
              ))}
            </div>
          ) : null}

          <div className="date-picker-footer">
            <button
              type="button"
              className="date-picker-footer-btn"
              onClick={() => {
                onChange("");
                closePicker();
              }}
            >
              {t("datePickerClear")}
            </button>
            <button
              type="button"
              className="date-picker-footer-btn date-picker-footer-primary"
              onClick={() => {
                onChange(formatDateValue(new Date()));
                closePicker();
              }}
            >
              {t("datePickerToday")}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
