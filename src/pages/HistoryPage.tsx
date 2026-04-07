import { CSSProperties, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { DatePickerInput } from "../components/DatePickerInput";
import { SectionTitle } from "../components/SectionTitle";
import { SelectMenu } from "../components/SelectMenu";
import { StatusBadge } from "../components/StatusBadge";
import { useApp, useTranslate } from "../context/AppContext";
import { HistoryRecord, TaskStatus } from "../data/mock";

type SortOrder = "desc" | "asc";
type HistoryStatusFilter = "all" | Exclude<TaskStatus, "idle">;
const pageSizeOptions = [5, 10, 20];

function triggerImageDownload(url: string, filename: string) {
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function parseRecordTime(value: string) {
  const parsed = new Date(value.replace(/\//g, "-")).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

function dateValueToTime(value: string, boundary: "start" | "end") {
  if (!value) {
    return boundary === "start" ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY;
  }

  return new Date(`${value}${boundary === "start" ? "T00:00:00" : "T23:59:59"}`).getTime();
}

export function HistoryPage() {
  const { currentUser, deleteHistoryRecord, historyRecords } = useApp();
  const { t } = useTranslate();
  const [activeRecord, setActiveRecord] = useState<HistoryRecord | null>(null);
  const [recordToDelete, setRecordToDelete] = useState<HistoryRecord | null>(null);
  const [removingRecordId, setRemovingRecordId] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [taskIdQuery, setTaskIdQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<HistoryStatusFilter>("all");
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [introActive, setIntroActive] = useState(true);
  const [toastMessage, setToastMessage] = useState("");
  const cardRefs = useRef<Map<string, HTMLElement>>(new Map());
  const previousCardRects = useRef<Map<string, DOMRect>>(new Map());
  const previousLayoutKey = useRef("");
  const pendingScrollY = useRef<number | null>(null);

  const filteredRecords = useMemo(() => {
    const startTime = dateValueToTime(dateFrom, "start");
    const endTime = dateValueToTime(dateTo, "end");
    const normalizedTaskId = taskIdQuery.trim();

    return [...historyRecords]
      .filter((record) => {
        const recordTime = parseRecordTime(record.createdAt);
        return (
          recordTime >= startTime &&
          recordTime <= endTime &&
          (normalizedTaskId ? record.id === normalizedTaskId : true) &&
          (statusFilter === "all" ? true : record.status === statusFilter)
        );
      })
      .sort((left, right) => {
        const diff = parseRecordTime(right.createdAt) - parseRecordTime(left.createdAt);
        return sortOrder === "desc" ? diff : -diff;
      });
  }, [dateFrom, dateTo, historyRecords, sortOrder, statusFilter, taskIdQuery]);

  const statusOptions: Array<{ value: HistoryStatusFilter; label: string }> = [
    { value: "all", label: t("historyStatusAll") },
    { value: "completed", label: t("taskCompleted") },
    { value: "processing", label: t("taskProcessing") },
    { value: "failed", label: t("taskFailed") },
  ];

  const selectedStatusLabel =
    statusOptions.find((option) => option.value === statusFilter)?.label ?? t("historyStatusAll");
  const hasActiveSearchConditions =
    Boolean(dateFrom || dateTo || taskIdQuery.trim()) || statusFilter !== "all" || sortOrder !== "desc";

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / pageSize));
  const pagedRecords = filteredRecords.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    if (activeRecord || recordToDelete) {
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [activeRecord, recordToDelete]);

  useEffect(() => {
    if (!toastMessage) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setToastMessage("");
    }, 1800);

    return () => window.clearTimeout(timeoutId);
  }, [toastMessage]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setIntroActive(false);
    }, 900);

    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [dateFrom, dateTo, pageSize, sortOrder, statusFilter, taskIdQuery]);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  useLayoutEffect(() => {
    if (pendingScrollY.current === null) {
      return;
    }

    window.scrollTo({ top: pendingScrollY.current, behavior: "instant" });
    pendingScrollY.current = null;
  }, [currentPage, pageSize]);

  const handlePageChange = (page: number) => {
    pendingScrollY.current = window.scrollY;
    setCurrentPage(page);
  };

  useLayoutEffect(() => {
    const layoutKey = pagedRecords.map((record) => record.id).join("|");
    const previousRects = previousCardRects.current;

    if (layoutKey === previousLayoutKey.current) {
      previousCardRects.current = new Map(
        pagedRecords.flatMap((record) => {
          const element = cardRefs.current.get(record.id);
          return element ? [[record.id, element.getBoundingClientRect()]] : [];
        }),
      );
      return;
    }

    pagedRecords.forEach((record) => {
      const element = cardRefs.current.get(record.id);
      const previousRect = previousRects.get(record.id);

      if (!element || !previousRect) {
        return;
      }

      const nextRect = element.getBoundingClientRect();
      const deltaY = previousRect.top - nextRect.top;

      if (Math.abs(deltaY) > 1) {
        element.animate(
          [{ transform: `translateY(${deltaY}px)` }, { transform: "translateY(0)" }],
          {
            duration: 420,
            easing: "cubic-bezier(0.22, 1, 0.36, 1)",
          },
        );
      }
    });

    previousCardRects.current = new Map(
      pagedRecords.flatMap((record) => {
        const element = cardRefs.current.get(record.id);
        return element ? [[record.id, element.getBoundingClientRect()]] : [];
      }),
    );
    previousLayoutKey.current = layoutKey;
  }, [pagedRecords]);

  const clearAllSearchConditions = () => {
    setDateFrom("");
    setDateTo("");
    setTaskIdQuery("");
    setStatusFilter("all");
    setSortOrder("desc");
  };

  const handleDeleteConfirm = () => {
    if (!recordToDelete) {
      return;
    }

    const recordId = recordToDelete.id;
    setRemovingRecordId(recordId);
    setRecordToDelete(null);
    window.setTimeout(() => {
      deleteHistoryRecord(recordId);
      setRemovingRecordId(null);
      if (activeRecord?.id === recordId) {
        setActiveRecord(null);
      }
    }, 180);
  };

  if (!currentUser) {
    return (
      <div className="page-stack">
        <SectionTitle eyebrow={t("historyEyebrow")} title={t("historyTitle")} description="" />
        <div className="panel empty-card">
          <p>{t("historyNeedLogin")}</p>
          <Link to="/login" className="primary-btn">
            {t("goLogin")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-stack">
      <div className="history-page-head">
        <SectionTitle eyebrow={t("historyEyebrow")} title={t("historyTitle")} description="" />
        <div className="history-tools">
          <button
            type="button"
            className={sortOrder === "asc" ? "history-tool-btn history-tool-btn-active" : "history-tool-btn"}
            onClick={() => setSortOrder((value) => (value === "desc" ? "asc" : "desc"))}
          >
            <span>{t("historySortLabel")}</span>
            <span
              className={
                sortOrder === "desc"
                  ? "history-sort-icon"
                  : "history-sort-icon history-sort-icon-asc"
              }
              aria-hidden="true"
            >
              <svg viewBox="0 0 1024 1024" fill="none">
                <path
                  d="M407.568 154.019c-11.952-11.925-26.904-17.894-41.853-17.894-5.972 0-11.952 2.984-17.929 2.984h-2.992c-8.964 5.961-14.94 11.941-20.921 17.902L81.77 398.634c-23.912 23.862-23.912 59.669 0 80.551 11.956 11.929 26.901 17.894 41.841 17.894 14.948 0 29.896-5.965 41.845-17.894l146.459-146.177v495.198c0 32.815 26.908 56.677 56.797 56.677 29.892 0 56.789-26.854 56.789-56.677V198.775c-0.001-14.925-5.973-32.819-17.933-44.756zM942.59 541.831c-11.956-11.941-26.904-17.905-41.849-17.905-14.944 0-29.889 5.965-41.845 17.905L709.45 690.977V195.791c0-32.819-26.901-56.681-56.785-56.681-29.892 0-56.797 26.85-56.797 56.681v635.391c0 32.811 26.904 56.693 56.797 56.693 14.944 0 29.885-5.98 41.841-17.905l245.097-244.615c26.896-23.859 26.896-59.658 2.987-83.524z"
                  fill="currentColor"
                />
              </svg>
            </span>
          </button>
          <div className="history-date-field">
            <div className="history-date-range">
              <span className="history-field-icon" aria-hidden="true">
                <svg viewBox="0 0 20 20" fill="none">
                  <path
                    d="M6 3.5v2M14 3.5v2M4.5 8h11M5.5 5h9A1.5 1.5 0 0 1 16 6.5v8A1.5 1.5 0 0 1 14.5 16h-9A1.5 1.5 0 0 1 4 14.5v-8A1.5 1.5 0 0 1 5.5 5Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <DatePickerInput
                value={dateFrom}
                onChange={setDateFrom}
                ariaLabel={t("historyDateFrom")}
                placeholder={t("historyDateFrom")}
              />
              <span className="history-date-separator">-</span>
              <DatePickerInput
                value={dateTo}
                onChange={setDateTo}
                ariaLabel={t("historyDateTo")}
                placeholder={t("historyDateTo")}
              />
            </div>
            {dateFrom || dateTo ? (
              <button
                type="button"
                className="history-clear-btn"
                onClick={() => {
                  setDateFrom("");
                  setDateTo("");
                }}
                aria-label={t("historyResetFilters")}
              >
                <svg viewBox="0 0 20 20" fill="none">
                  <path
                    d="M6 6l8 8M14 6l-8 8"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            ) : null}
          </div>
          <div className="history-search-field">
            <span className="history-field-icon" aria-hidden="true">
              <svg viewBox="0 0 20 20" fill="none">
                <circle cx="9" cy="9" r="4.5" stroke="currentColor" strokeWidth="1.5" />
                <path d="M12.5 12.5 16 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </span>
            <input
              className="history-task-search"
              value={taskIdQuery}
              onChange={(event) => setTaskIdQuery(event.target.value)}
              placeholder={t("historyTaskIdSearch")}
            />
            {taskIdQuery ? (
              <button
                type="button"
                className="history-clear-btn"
                onClick={() => setTaskIdQuery("")}
                aria-label={t("historyResetFilters")}
              >
                <svg viewBox="0 0 20 20" fill="none">
                  <path
                    d="M6 6l8 8M14 6l-8 8"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            ) : null}
          </div>
          <div className="history-status-filter">
            <button
              type="button"
              className="history-status-trigger"
              onClick={() => setStatusMenuOpen((value) => !value)}
              aria-label={t("historyStatusFilter")}
            >
              {statusFilter === "all" ? (
                <span className="history-status-all-badge">{selectedStatusLabel}</span>
              ) : (
                <StatusBadge status={statusFilter} />
              )}
              <span
                className={
                  statusMenuOpen
                    ? "select-menu-icon select-menu-icon-open"
                    : "select-menu-icon"
                }
                aria-hidden="true"
              >
                <svg viewBox="0 0 20 20" fill="none">
                  <path
                    d="m6 8 4 4 4-4"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </button>
            {statusMenuOpen ? (
              <div className="history-status-menu">
                {statusOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={
                      statusFilter === option.value
                        ? "history-status-option selected"
                        : "history-status-option"
                    }
                    onClick={() => {
                      setStatusFilter(option.value);
                      setStatusMenuOpen(false);
                    }}
                  >
                    {option.value === "all" ? (
                      <span className="history-status-all-badge">{option.label}</span>
                    ) : (
                      <StatusBadge status={option.value} />
                    )}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <button
            type="button"
            className="history-clear-all-btn"
            disabled={!hasActiveSearchConditions}
            onClick={clearAllSearchConditions}
            aria-label={t("historyResetFilters")}
          >
            <svg viewBox="0 0 1024 1024" fill="none">
              <path
                d="M883.2 403.2l-147.2-44.8 57.6-224c0-6.4 0-19.2-6.4-25.6-6.4-6.4-12.8-12.8-19.2-12.8L627.2 57.6c-6.4 0-19.2 0-25.6 0C595.2 70.4 588.8 76.8 588.8 83.2L524.8 300.8 358.4 256c-6.4 0-19.2 0-25.6 0S320 275.2 320 281.6l-89.6 320C211.2 684.8 128 768 128 768c-6.4 6.4-12.8 19.2-6.4 32 0 12.8 12.8 19.2 25.6 25.6l524.8 140.8c0 0 6.4 0 6.4 0 6.4 0 19.2-6.4 25.6-12.8 6.4-6.4 83.2-89.6 115.2-179.2 32-83.2 89.6-326.4 89.6-332.8C908.8 422.4 896 409.6 883.2 403.2zM755.2 748.8c-25.6 57.6-70.4 115.2-89.6 147.2l-70.4-19.2c32-38.4 70.4-96 89.6-160 6.4-19.2-6.4-32-25.6-38.4-19.2-6.4-32 6.4-38.4 25.6-19.2 70.4-76.8 134.4-96 153.6l-57.6-12.8c32-38.4 70.4-96 83.2-153.6 6.4-19.2-6.4-32-25.6-38.4-19.2-6.4-32 6.4-38.4 25.6-19.2 64-70.4 128-89.6 153.6l-64-19.2c32-38.4 70.4-96 89.6-153.6 6.4-19.2-6.4-32-25.6-38.4C384 608 364.8 620.8 364.8 633.6c-19.2 64-70.4 128-96 153.6l-57.6-19.2c32-38.4 70.4-96 83.2-153.6l76.8-294.4 166.4 44.8c6.4 0 19.2 0 25.6 0C569.6 364.8 576 358.4 582.4 352L640 128l83.2 19.2-57.6 224c-6.4 19.2 6.4 32 19.2 38.4L832 454.4C819.2 524.8 780.8 691.2 755.2 748.8z"
                fill="currentColor"
              />
              <path
                d="M364.8 473.6C364.8 492.8 371.2 505.6 390.4 512l339.2 96c0 0 6.4 0 6.4 0 12.8 0 25.6-6.4 32-25.6 6.4-19.2-6.4-32-19.2-38.4L409.6 448C390.4 448 371.2 454.4 364.8 473.6z"
                fill="currentColor"
              />
            </svg>
          </button>
        </div>
      </div>

      {historyRecords.length === 0 ? (
        <div className="panel empty-card">
          <p>{t("noHistory")}</p>
          <Link to="/transfer" className="primary-btn">
            {t("navTransfer")}
          </Link>
        </div>
      ) : null}

      {historyRecords.length > 0 && filteredRecords.length === 0 ? (
        <div className="panel empty-card">
          <p>{t("noFilteredHistory")}</p>
        </div>
      ) : null}

      <section className="history-list">
        {pagedRecords.map((record, index) => (
          <article
            key={record.id}
            data-record-id={record.id}
            ref={(element) => {
              if (element) {
                cardRefs.current.set(record.id, element);
              } else {
                cardRefs.current.delete(record.id);
              }
            }}
            className={
              removingRecordId === record.id
                ? "panel history-card history-card-removing"
                : introActive
                  ? "panel history-card history-card-intro"
                  : "panel history-card"
            }
            style={introActive ? { animationDelay: `${Math.min(index, 6) * 70}ms` } as CSSProperties : undefined}
            onClick={() => (record.status === "failed" ? undefined : setActiveRecord(record))}
          >
            <div className="history-card-head">
              <div>
                <h3>{record.title}</h3>
                <p>{record.createdAt}</p>
              </div>
              <div className="history-card-actions">
                <button
                  type="button"
                  className="history-icon-btn history-icon-btn-download"
                  disabled={!record.resultImage}
                  onClick={(event) => {
                    event.stopPropagation();
                    if (record.resultImage) {
                      triggerImageDownload(record.resultImage, `${record.id}-result.jpg`);
                    }
                  }}
                  aria-label="Download result"
                >
                  <svg viewBox="0 0 20 20" fill="none">
                    <path
                      d="M10 4v8M6.5 9 10 12.5 13.5 9M5 16h10"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
                <button
                  type="button"
                  className="history-icon-btn history-icon-btn-danger"
                  onClick={(event) => {
                    event.stopPropagation();
                    setRecordToDelete(record);
                  }}
                  aria-label="Delete history record"
                >
                  <svg viewBox="0 0 20 20" fill="none">
                    <path
                      d="M7 5V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1M4.5 5h11M6 7.5l.5 8h7l.5-8M8.5 9.5v4M11.5 9.5v4"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
                <StatusBadge status={record.status} />
              </div>
            </div>
            <div className="history-card-body">
              {record.status === "failed" ? (
                <div className="mini-preview history-failed-preview">
                  <span>{t("generationFailed")}</span>
                </div>
              ) : record.resultImage ? (
                <img
                  className="mini-preview history-preview-image"
                  src={record.resultImage}
                  alt={record.title}
                />
              ) : (
                <div className="mini-preview" />
              )}
              <div className="history-meta">
                <p className="history-task-id-row">
                  <span>{t("taskId", { value: record.id })}</span>
                  <button
                    type="button"
                    className="history-copy-btn"
                    onClick={(event) => {
                      event.stopPropagation();
                      void navigator.clipboard.writeText(record.id).then(() => {
                        setToastMessage(t("taskIdCopied"));
                      });
                    }}
                    aria-label="Copy task ID"
                  >
                    <svg viewBox="0 0 20 20" fill="none">
                      <path
                        d="M7 7V5.5A1.5 1.5 0 0 1 8.5 4h6A1.5 1.5 0 0 1 16 5.5v6A1.5 1.5 0 0 1 14.5 13H13M5.5 7h6A1.5 1.5 0 0 1 13 8.5v6a1.5 1.5 0 0 1-1.5 1.5h-6A1.5 1.5 0 0 1 4 14.5v-6A1.5 1.5 0 0 1 5.5 7Z"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </p>
                <p>{t("styleSource", { value: record.styleName })}</p>
                <p>{record.summary}</p>
              </div>
            </div>
          </article>
        ))}
      </section>

      {historyRecords.length > 0 ? (
        <div className="history-pagination">
          <button
            type="button"
            className="history-page-btn"
            disabled={currentPage === 1}
            onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
          >
            {t("historyPagePrevious")}
          </button>
          <div className="history-page-numbers">
            {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
              <button
                key={page}
                type="button"
                className={
                  currentPage === page
                    ? "history-page-number history-page-number-active"
                    : "history-page-number"
                }
                onClick={() => handlePageChange(page)}
              >
                {page}
              </button>
            ))}
          </div>
          <label className="history-page-size">
            <span>{t("historyPageSize")}</span>
            <SelectMenu
              value={String(pageSize)}
              options={pageSizeOptions.map((option) => ({
                value: String(option),
                label: String(option),
              }))}
              onChange={(value) => {
                pendingScrollY.current = window.scrollY;
                setPageSize(Number(value));
              }}
            />
          </label>
          <button
            type="button"
            className="history-page-btn"
            disabled={currentPage === totalPages}
            onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
          >
            {t("historyPageNext")}
          </button>
        </div>
      ) : null}

      {activeRecord ? (
        <button
          type="button"
          className="preview-modal history-modal-overlay"
          onClick={() => setActiveRecord(null)}
        >
          <div className="history-modal" onClick={(event) => event.stopPropagation()}>
            <div className="history-modal-head">
              <div>
                <h3>{activeRecord.title}</h3>
                <p>{activeRecord.createdAt}</p>
              </div>
              <StatusBadge status={activeRecord.status} />
            </div>

            <div className="history-modal-grid">
              <button
                type="button"
                className="history-modal-image-card"
                onClick={() =>
                  activeRecord.contentImage
                    ? triggerImageDownload(activeRecord.contentImage, `${activeRecord.id}-content.png`)
                    : undefined
                }
              >
                <span className="panel-label">{t("homeContent")}</span>
                {activeRecord.contentImage ? (
                  <img
                    className="history-modal-image"
                    src={activeRecord.contentImage}
                    alt={t("homeContent")}
                  />
                ) : (
                  <div className="history-modal-empty" />
                )}
              </button>

              <button
                type="button"
                className="history-modal-image-card"
                onClick={() =>
                  activeRecord.styleImage
                    ? triggerImageDownload(activeRecord.styleImage, `${activeRecord.id}-style.png`)
                    : undefined
                }
              >
                <span className="panel-label">{t("homeStyle")}</span>
                {activeRecord.styleImage ? (
                  <img
                    className="history-modal-image"
                    src={activeRecord.styleImage}
                    alt={t("homeStyle")}
                  />
                ) : (
                  <div className="history-modal-empty" />
                )}
              </button>

              <button
                type="button"
                className="history-modal-image-card"
                onClick={() =>
                  activeRecord.resultImage
                    ? triggerImageDownload(activeRecord.resultImage, `${activeRecord.id}-result.jpg`)
                    : undefined
                }
              >
                <span className="panel-label">{t("homeResult")}</span>
                {activeRecord.resultImage ? (
                  <img
                    className="history-modal-image"
                    src={activeRecord.resultImage}
                    alt={t("homeResult")}
                  />
                ) : (
                  <div className="history-modal-empty" />
                )}
              </button>
            </div>

            <div className="history-modal-meta">
              <p>{t("taskId", { value: activeRecord.id })}</p>
              <p>{t("styleSource", { value: activeRecord.styleName })}</p>
              <p>{t("strengthLabel", { value: String(activeRecord.strength ?? 0) })}</p>
              <p>
                {t("structureLabel", {
                  value: activeRecord.preserveStructure ? t("switchOn") : t("switchOff"),
                })}
              </p>
            </div>
          </div>
        </button>
      ) : null}

      {recordToDelete ? (
        <button
          type="button"
          className="preview-modal history-delete-overlay"
          onClick={() => setRecordToDelete(null)}
        >
          <div className="history-delete-modal" onClick={(event) => event.stopPropagation()}>
            <span className="panel-label">{t("navHistory")}</span>
            <h3>{t("historyDeleteTitle")}</h3>
            <p>{t("historyDeleteDescription")}</p>
            <div className="history-delete-actions">
              <button type="button" className="ghost-btn" onClick={() => setRecordToDelete(null)}>
                {t("cancel")}
              </button>
              <button type="button" className="primary-btn danger-btn" onClick={handleDeleteConfirm}>
                {t("delete")}
              </button>
            </div>
          </div>
        </button>
      ) : null}

      {toastMessage ? (
        <div className="toast toast-success" role="status" aria-live="polite">
          <div className="toast-dot" />
          <span>{toastMessage}</span>
        </div>
      ) : null}
    </div>
  );
}
