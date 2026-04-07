import { CSSProperties, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import stylizedImage from "../assets/stylizedImage.jpg";
import { presetImageMap } from "../assets/presetImages";
import { FileDropCard } from "../components/FileDropCard";
import { SelectMenu } from "../components/SelectMenu";
import { StatusBadge } from "../components/StatusBadge";
import { StylePresetGrid } from "../components/StylePresetGrid";
import { useApp, useTranslate } from "../context/AppContext";
import { HistoryRecord, presetStyles, TaskStatus } from "../data/mock";
import {
  findImageById,
  persistLocalImage,
  readDraftByUser,
  saveDraftByUser,
  StoredImage,
  TransferDraft,
} from "../utils/localTransfer";

const defaultDraft: TransferDraft = {
  contentImageId: null,
  customStyleImageId: null,
  selectedStyle: "ink",
  strength: 65,
  resolution: "1024",
  preserveStructure: true,
};

const resolutionOptions = [
  { value: "512", label: "512 x 512" },
  { value: "1024", label: "1024 x 1024" },
  { value: "1536", label: "1536 x 1536" },
];

const outputImageModules = import.meta.glob("../assets/outputs/*", {
  eager: true,
  import: "default",
}) as Record<string, string>;

const GUEST_PROMPT_SEEN_KEY = "style-transfer-guest-prompt-seen";
const LAYOUT_STORAGE_KEY = "style-transfer-transfer-layout-by-user";

const defaultLayoutOrder = [
  "content-upload",
  "style-upload",
  "parameters",
  "content-preview",
  "style-preview",
  "status",
  "preset-gallery",
  "result-preview",
] as const;

type LayoutCardId = (typeof defaultLayoutOrder)[number];
type LayoutSlot = LayoutCardId | null;

const defaultLayoutSlots: LayoutSlot[] = [
  "content-upload",
  "style-upload",
  "parameters",
  "content-preview",
  "style-preview",
  "status",
  null,
  "preset-gallery",
  "result-preview",
];

function readLayoutByUser() {
  try {
    const raw = window.localStorage.getItem(LAYOUT_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, LayoutSlot[]>) : {};
  } catch {
    return {};
  }
}

function saveLayoutByUser(value: Record<string, LayoutSlot[]>) {
  window.localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(value));
}

function normalizeLayoutOrder(order?: LayoutSlot[]) {
  if (!order) {
    return [...defaultLayoutSlots];
  }

  const allowed = new Set<LayoutCardId>(defaultLayoutOrder);
  const seen = new Set<LayoutCardId>();
  const nextOrder: LayoutSlot[] = [];
  let hasEmptySlot = false;

  order.forEach((item) => {
    if (item === null) {
      if (!hasEmptySlot) {
        nextOrder.push(null);
        hasEmptySlot = true;
      }
      return;
    }

    if (allowed.has(item) && !seen.has(item)) {
      nextOrder.push(item);
      seen.add(item);
    }
  });

  defaultLayoutOrder.forEach((item) => {
    if (!seen.has(item)) {
      nextOrder.push(item);
    }
  });

  if (!hasEmptySlot) {
    nextOrder.push(null);
  }

  return nextOrder;
}

function triggerImageDownload(url: string, filename: string) {
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function TransferPage() {
  const navigate = useNavigate();
  const { addHistoryRecord, currentUser } = useApp();
  const { t, styleDescription, styleName } = useTranslate();
  const draftKey = currentUser ?? "guest";
  const layoutKey = currentUser ? `user:${currentUser}` : "guest";

  const [contentImage, setContentImage] = useState<StoredImage | null>(null);
  const [styleImage, setStyleImage] = useState<StoredImage | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<string>("ink");
  const [strength, setStrength] = useState(65);
  const [resolution, setResolution] = useState("1024");
  const [preserveStructure, setPreserveStructure] = useState(true);
  const [taskStatus, setTaskStatus] = useState<TaskStatus>("idle");
  const [draftReady, setDraftReady] = useState(false);
  const [activePreview, setActivePreview] = useState<{ src: string; alt: string } | null>(null);
  const [guestPromptOpen, setGuestPromptOpen] = useState(false);
  const [resultImage, setResultImage] = useState<string>(stylizedImage);
  const [layoutOrder, setLayoutOrder] = useState<LayoutSlot[]>([...defaultLayoutSlots]);
  const [layoutBeforeEdit, setLayoutBeforeEdit] = useState<LayoutSlot[]>([...defaultLayoutSlots]);
  const [layoutEditing, setLayoutEditing] = useState(false);
  const [draggedCardId, setDraggedCardId] = useState<LayoutCardId | null>(null);
  const [layoutResetOpen, setLayoutResetOpen] = useState(false);

  const sliderStyle = { "--slider-progress": `${strength}%` } as CSSProperties;

  useEffect(() => {
    if (!currentUser) {
      const hasSeenPrompt = window.sessionStorage.getItem(GUEST_PROMPT_SEEN_KEY) === "1";
      setGuestPromptOpen(!hasSeenPrompt);
    } else {
      setGuestPromptOpen(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) {
      const defaultOrder = normalizeLayoutOrder();
      setLayoutOrder(defaultOrder);
      setLayoutBeforeEdit(defaultOrder);
      setLayoutEditing(false);
      setDraggedCardId(null);
      return;
    }

    const savedLayouts = readLayoutByUser();
    const savedOrder = normalizeLayoutOrder(savedLayouts[layoutKey]);
    setLayoutOrder(savedOrder);
    setLayoutBeforeEdit(savedOrder);
    setLayoutEditing(false);
    setDraggedCardId(null);
  }, [currentUser, layoutKey]);

  useEffect(() => {
    setDraftReady(false);
    const draftByUser = readDraftByUser();
    const draft = draftByUser[draftKey] ?? defaultDraft;
    setContentImage(findImageById(draft.contentImageId));
    setStyleImage(findImageById(draft.customStyleImageId));
    setSelectedStyle(draft.selectedStyle);
    setStrength(draft.strength);
    setResolution(draft.resolution);
    setPreserveStructure(draft.preserveStructure);
    setTaskStatus("idle");
    setResultImage(stylizedImage);
    setDraftReady(true);
  }, [draftKey]);

  useEffect(() => {
    if (!draftReady) {
      return;
    }

    const draftByUser = readDraftByUser();
    draftByUser[draftKey] = {
      contentImageId: contentImage?.id ?? null,
      customStyleImageId: styleImage?.id ?? null,
      selectedStyle,
      strength,
      resolution,
      preserveStructure,
    };
    saveDraftByUser(draftByUser);
  }, [
    contentImage,
    draftKey,
    draftReady,
    preserveStructure,
    resolution,
    selectedStyle,
    strength,
    styleImage,
  ]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    if (activePreview || guestPromptOpen || layoutResetOpen) {
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [activePreview, guestPromptOpen, layoutResetOpen]);

  const selectedStyleName = useMemo(() => {
    if (styleImage) {
      return t("customStyle");
    }

    const matched = presetStyles.find((item) => item.id === selectedStyle);
    return matched ? styleName(matched.nameKey) : t("notSelected");
  }, [selectedStyle, styleImage, styleName, t]);

  const handleContentUpload = async (file?: File) => {
    if (!file) {
      return;
    }

    const stored = await persistLocalImage(file);
    setContentImage(stored);
  };

  const handleCustomStyle = async (file?: File) => {
    if (!file) {
      return;
    }

    const stored = await persistLocalImage(file);
    setStyleImage(stored);
    setSelectedStyle("");
  };

  const resolveOutputImage = () => {
    if (!styleImage?.name) {
      return stylizedImage;
    }

    const lowerName = styleImage.name.toLowerCase();
    const matchedStyleKey = ["style1", "style2", "style3", "style4", "style5"].find((item) =>
      lowerName.includes(item),
    );

    if (!matchedStyleKey) {
      return stylizedImage;
    }

    const matchedOutput = Object.entries(outputImageModules).find(([path]) =>
      path.toLowerCase().includes(matchedStyleKey),
    );

    return matchedOutput?.[1] ?? stylizedImage;
  };

  const createHistoryRecord = (
    status: Exclude<TaskStatus, "idle">,
    generatedResultImage?: string,
  ): HistoryRecord => ({
    id: `task-${Date.now()}`,
    title: contentImage?.name
      ? `${contentImage.name}${currentUser ? ` - ${currentUser}` : ""}`
      : t("untitledTask"),
    status,
    createdAt: new Date().toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }),
    styleName: selectedStyleName,
    summary: status === "completed" ? t("localSummary") : t("generateError"),
    contentImage: contentImage?.dataUrl,
    styleImage:
      styleImage?.dataUrl ??
      (selectedStyle ? presetImageMap[selectedStyle as keyof typeof presetImageMap] : undefined),
    resultImage: generatedResultImage,
    strength,
    preserveStructure,
  });

  const handleGenerate = () => {
    if (!contentImage || (!styleImage && !selectedStyle)) {
      setTaskStatus("failed");
      addHistoryRecord(createHistoryRecord("failed"));
      return;
    }

    setTaskStatus("processing");
    window.setTimeout(() => {
      const generatedResultImage = resolveOutputImage();
      setResultImage(generatedResultImage);
      setTaskStatus("completed");
      addHistoryRecord(createHistoryRecord("completed", generatedResultImage));
    }, 1800);
  };

  const handleDownloadResult = () => {
    if (taskStatus !== "completed") {
      return;
    }

    const baseName = contentImage?.name
      ? contentImage.name.replace(/\.[^/.]+$/, "")
      : "stylized-image";
    const extension = resultImage.endsWith(".png") ? "png" : "jpg";
    triggerImageDownload(resultImage, `${baseName}-result.${extension}`);
  };

  const closeGuestPrompt = () => {
    window.sessionStorage.setItem(GUEST_PROMPT_SEEN_KEY, "1");
    setGuestPromptOpen(false);
  };

  const handleGoLogin = () => {
    window.sessionStorage.setItem(GUEST_PROMPT_SEEN_KEY, "1");
    setGuestPromptOpen(false);
    navigate("/login");
  };

  const startLayoutEditing = () => {
    setLayoutBeforeEdit(layoutOrder);
    setLayoutEditing(true);
  };

  const saveLayoutEditing = () => {
    if (!currentUser) {
      setLayoutBeforeEdit(layoutOrder);
      setLayoutEditing(false);
      setDraggedCardId(null);
      return;
    }

    const savedLayouts = readLayoutByUser();
    savedLayouts[layoutKey] = layoutOrder;
    saveLayoutByUser(savedLayouts);
    setLayoutBeforeEdit(layoutOrder);
    setLayoutEditing(false);
    setDraggedCardId(null);
  };

  const cancelLayoutEditing = () => {
    setLayoutOrder(layoutBeforeEdit);
    setLayoutEditing(false);
    setDraggedCardId(null);
  };

  const resetLayoutToDefault = () => {
    const defaultOrder = normalizeLayoutOrder();
    setLayoutOrder(defaultOrder);
    setLayoutBeforeEdit(defaultOrder);
    setLayoutEditing(false);
    setDraggedCardId(null);
    setLayoutResetOpen(false);

    if (currentUser) {
      const savedLayouts = readLayoutByUser();
      savedLayouts[layoutKey] = defaultOrder;
      saveLayoutByUser(savedLayouts);
    }
  };

  const moveLayoutCardToIndex = (targetIndex: number) => {
    if (!draggedCardId) {
      return;
    }

    setLayoutOrder((order) => {
      const sourceIndex = order.indexOf(draggedCardId);
      if (sourceIndex < 0 || targetIndex < 0 || targetIndex >= order.length || sourceIndex === targetIndex) {
        return order;
      }

      const nextOrder = [...order];
      nextOrder[sourceIndex] = nextOrder[targetIndex];
      nextOrder[targetIndex] = draggedCardId;
      return nextOrder;
    });
  };

  const cardContentById: Record<LayoutCardId, JSX.Element> = {
    "content-upload": (
      <FileDropCard
        title={t("uploadContentTitle")}
        hint={t("uploadContentHint")}
        fileName={contentImage?.name}
        emptyLabel={t("chooseImage")}
        previewSrc={contentImage?.dataUrl}
        onFileChange={handleContentUpload}
      />
    ),
    "content-preview": (
      <div className="panel preview-panel">
        <span className="panel-label">{t("contentPreview")}</span>
        <button
          type="button"
          className={contentImage ? "preview-surface preview-surface-active" : "preview-surface"}
          onClick={() =>
            contentImage
              ? setActivePreview({ src: contentImage.dataUrl, alt: contentImage.name })
              : undefined
          }
        >
          {contentImage ? (
            <img
              className="preview-image preview-image-float"
              src={contentImage.dataUrl}
              alt={contentImage.name}
            />
          ) : (
            <div className="preview-placeholder preview-blackboard" />
          )}
        </button>
      </div>
    ),
    "style-upload": (
      <FileDropCard
        title={t("uploadStyleTitle")}
        hint={t("uploadStyleHint")}
        fileName={styleImage?.name}
        emptyLabel={t("chooseImage")}
        previewSrc={styleImage?.dataUrl}
        onFileChange={handleCustomStyle}
      />
    ),
    "style-preview": (
      <div className="panel preview-panel">
        <span className="panel-label">{t("stylePreview")}</span>
        <button
          type="button"
          className={styleImage ? "preview-surface preview-surface-active" : "preview-surface"}
          onClick={() =>
            styleImage ? setActivePreview({ src: styleImage.dataUrl, alt: styleImage.name }) : undefined
          }
        >
          {styleImage ? (
            <img
              className="preview-image preview-image-float"
              src={styleImage.dataUrl}
              alt={styleImage.name}
            />
          ) : (
            <div className="preview-placeholder preview-blackboard" />
          )}
        </button>
      </div>
    ),
    "preset-gallery": (
      <div className="panel">
        <span className="panel-label">{t("presetGallery")}</span>
        <StylePresetGrid
          styles={presetStyles}
          selectedId={selectedStyle}
          onSelect={(id) => {
            setSelectedStyle(id);
            setStyleImage(null);
          }}
          getName={(style) => styleName(style.nameKey)}
          getDescription={(style) => styleDescription(style.nameKey)}
        />
      </div>
    ),
    parameters: (
      <div className="panel form-panel">
        <span className="panel-label">{t("parameters")}</span>
        <label>
          {t("styleStrength")}
          <input
            className="strength-slider"
            style={sliderStyle}
            type="range"
            min="0"
            max="100"
            value={strength}
            onChange={(event) => setStrength(Number(event.target.value))}
          />
          <span className="slider-value">{strength}%</span>
        </label>
        <label>
          {t("outputSize")}
          <SelectMenu value={resolution} options={resolutionOptions} onChange={setResolution} />
        </label>
        <label
          className={preserveStructure ? "toggle-field toggle-field-active" : "toggle-field"}
        >
          <input
            className="toggle-field-input"
            type="checkbox"
            checked={preserveStructure}
            onChange={(event) => setPreserveStructure(event.target.checked)}
          />
          <span className="toggle-field-copy">{t("preserveStructure")}</span>
          <span
            className={preserveStructure ? "toggle-switch toggle-switch-on" : "toggle-switch"}
            aria-hidden="true"
          >
            <span className="toggle-switch-thumb" />
          </span>
        </label>
      </div>
    ),
    status: (
      <div className="panel status-panel">
        <div className="status-head">
          <span className="panel-label">{t("taskStatus")}</span>
          <StatusBadge status={taskStatus} />
        </div>
        <ul className="meta-list">
          <li>{t("contentLabel", { value: contentImage?.name ?? t("notUploaded") })}</li>
          <li>{t("styleSourceLabel", { value: selectedStyleName })}</li>
          <li>{t("outputSizeLabel", { value: resolution })}</li>
          <li>{t("strengthLabel", { value: String(strength) })}</li>
          <li>
            {t("structureLabel", {
              value: preserveStructure ? t("switchOn") : t("switchOff"),
            })}
          </li>
        </ul>
        <button type="button" className="primary-btn full-width" onClick={handleGenerate}>
          {t("generate")}
        </button>
        {taskStatus === "failed" ? <p className="error-text">{t("generateError")}</p> : null}
      </div>
    ),
    "result-preview": (
      <div className="panel result-panel">
        <span className="panel-label">{t("resultPreview")}</span>
        <button
          type="button"
          className={
            taskStatus === "completed"
              ? "preview-surface preview-surface-active"
              : "preview-surface"
          }
          onClick={() =>
            taskStatus === "completed"
              ? setActivePreview({ src: resultImage, alt: t("resultPreview") })
              : undefined
          }
        >
          {taskStatus === "completed" ? (
            <img
              className="preview-image preview-image-float"
              src={resultImage}
              alt={t("resultPreview")}
            />
          ) : (
            <div className="preview-placeholder preview-blackboard" />
          )}
        </button>
        <button
          type="button"
          className="ghost-btn full-width"
          disabled={taskStatus !== "completed"}
          onClick={handleDownloadResult}
        >
          {t("downloadResult")}
        </button>
      </div>
    ),
  };

  const layoutColumns = useMemo(
    () =>
      [0, 1, 2].map((columnIndex) =>
        layoutOrder
          .map((cardId, index) => ({ cardId, index }))
          .filter((item) => item.index % 3 === columnIndex),
      ),
    [layoutOrder],
  );

  return (
    <>
      <div className={guestPromptOpen ? "page-stack page-stack-blurred" : "page-stack"}>
        <div className="transfer-page-head">
          <div className="section-title transfer-section-title">
            <span>{t("transferEyebrow")}</span>
            <div className="transfer-title-row">
              <h2>{t("transferTitle")}</h2>
              <div className="transfer-layout-actions">
                {layoutEditing ? (
                  <>
                    <button type="button" className="primary-btn" onClick={saveLayoutEditing}>
                      {t("saveLayout")}
                    </button>
                    <button type="button" className="ghost-btn" onClick={cancelLayoutEditing}>
                      {t("cancelLayout")}
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className="ghost-btn custom-layout-btn"
                    onClick={startLayoutEditing}
                  >
                    {t("customLayout")}
                  </button>
                )}
                <button
                  type="button"
                  className="layout-reset-btn"
                  disabled={layoutEditing}
                  onClick={() => setLayoutResetOpen(true)}
                  aria-label={t("resetLayout")}
                >
                  <svg viewBox="0 0 1024 1024" fill="none" aria-hidden="true">
                    <path
                      d="M524.8 106.666667c-106.666667 0-209.066667 42.666667-285.866667 110.933333l-8.533333-68.266667c0-25.6-21.333333-42.666667-46.933333-38.4-25.6 0-42.666667 21.333333-38.4 46.933334l8.533333 115.2c4.266667 55.466667 51.2 98.133333 106.666667 98.133333h8.533333L384 362.666667c25.6 0 42.666667-21.333333 38.4-46.933334 0-25.6-21.333333-42.666667-46.933333-38.4l-85.333334 4.266667c64-55.466667 145.066667-89.6 230.4-89.6 187.733333 0 341.333333 153.6 341.333334 341.333333s-153.6 341.333333-341.333334 341.333334-341.333333-153.6-341.333333-341.333334c0-25.6-17.066667-42.666667-42.666667-42.666666s-42.666667 17.066667-42.666666 42.666666c0 234.666667 192 426.666667 426.666666 426.666667s426.666667-192 426.666667-426.666667c4.266667-234.666667-187.733333-426.666667-422.4-426.666666z"
                      fill="currentColor"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {!currentUser ? (
          <div className="panel notice-card">
            <p>{t("authNeedLogin")}</p>
            <Link to="/login" className="ghost-btn">
              {t("goLogin")}
            </Link>
          </div>
        ) : null}

        <section className={layoutEditing ? "transfer-grid transfer-grid-editing" : "transfer-grid"}>
          {layoutColumns.map((column, columnIndex) => (
            <div className="transfer-layout-column" key={`layout-column-${columnIndex}`}>
              {column.map(({ cardId, index }) =>
                cardId ? (
                  <div
                    key={cardId}
                    className={
                      draggedCardId === cardId
                        ? `transfer-layout-card transfer-layout-card-${cardId} transfer-layout-card-dragging`
                        : `transfer-layout-card transfer-layout-card-${cardId}`
                    }
                    draggable={layoutEditing}
                    onDragStart={(event) => {
                      if (!layoutEditing) {
                        return;
                      }
                      setDraggedCardId(cardId);
                      event.dataTransfer.effectAllowed = "move";
                      event.dataTransfer.setData("text/plain", cardId);
                    }}
                    onDragOver={(event) => {
                      if (layoutEditing) {
                        event.preventDefault();
                      }
                    }}
                    onDrop={(event) => {
                      if (!layoutEditing) {
                        return;
                      }
                      event.preventDefault();
                      moveLayoutCardToIndex(index);
                      setDraggedCardId(null);
                    }}
                    onDragEnd={() => setDraggedCardId(null)}
                  >
                    {cardContentById[cardId]}
                  </div>
                ) : (
                  <div
                    key={`empty-slot-${index}`}
                    className={
                      layoutEditing
                        ? "transfer-layout-empty transfer-layout-empty-active"
                        : "transfer-layout-empty"
                    }
                    onDragOver={(event) => {
                      if (layoutEditing) {
                        event.preventDefault();
                      }
                    }}
                    onDrop={(event) => {
                      if (!layoutEditing) {
                        return;
                      }
                      event.preventDefault();
                      moveLayoutCardToIndex(index);
                      setDraggedCardId(null);
                    }}
                  />
                ),
              )}
            </div>
          ))}
        </section>

        {activePreview ? (
          <button type="button" className="preview-modal" onClick={() => setActivePreview(null)}>
            <img className="preview-modal-image" src={activePreview.src} alt={activePreview.alt} />
          </button>
        ) : null}
      </div>

      {guestPromptOpen ? (
        <div
          className="guest-prompt-overlay"
          role="dialog"
          aria-modal="true"
          onClick={closeGuestPrompt}
        >
          <div className="guest-prompt-card" onClick={(event) => event.stopPropagation()}>
            <span className="panel-label">{t("navLogin")}</span>
            <h3>{t("guestPromptTitle")}</h3>
            <p>{t("guestPromptDescription")}</p>
            <div className="guest-prompt-actions">
              <button type="button" className="primary-btn" onClick={handleGoLogin}>
                {t("goLogin")}
              </button>
              <button type="button" className="ghost-btn" onClick={closeGuestPrompt}>
                {t("continueAsGuest")}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {layoutResetOpen ? (
        <div
          className="guest-prompt-overlay"
          role="dialog"
          aria-modal="true"
          onClick={() => setLayoutResetOpen(false)}
        >
          <div className="guest-prompt-card" onClick={(event) => event.stopPropagation()}>
            <span className="panel-label">{t("resetLayout")}</span>
            <h3>{t("resetLayoutTitle")}</h3>
            <p>{t("resetLayoutDescription")}</p>
            <div className="guest-prompt-actions">
              <button type="button" className="ghost-btn" onClick={() => setLayoutResetOpen(false)}>
                {t("cancel")}
              </button>
              <button type="button" className="primary-btn danger-btn" onClick={resetLayoutToDefault}>
                {t("resetLayoutConfirm")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
