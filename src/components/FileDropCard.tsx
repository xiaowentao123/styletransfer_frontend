import { ChangeEvent, DragEvent, useState } from "react";
import { useTranslate } from "../context/AppContext";

type FileDropCardProps = {
  title: string;
  hint: string;
  fileName?: string;
  emptyLabel: string;
  previewSrc?: string | null;
  onFileChange: (file?: File) => void;
};

export function FileDropCard({
  title,
  hint,
  fileName,
  emptyLabel,
  previewSrc,
  onFileChange,
}: FileDropCardProps) {
  const { t } = useTranslate();
  const [isDragOver, setIsDragOver] = useState(false);
  const [fileError, setFileError] = useState("");

  const handleFile = (file?: File) => {
    if (!file) {
      return;
    }

    const isAcceptedImage =
      ["image/jpeg", "image/png"].includes(file.type) ||
      /\.(jpe?g|png)$/i.test(file.name);

    if (!isAcceptedImage) {
      setFileError(t("uploadInvalidType"));
      return;
    }

    setFileError("");
    onFileChange(file);
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    handleFile(event.target.files?.[0]);
    event.target.value = "";
  };

  const handleDragEnter = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragOver = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragOver(false);
    handleFile(event.dataTransfer.files?.[0]);
  };

  return (
    <label
      className={isDragOver ? "panel drop-card drop-card-active" : "panel drop-card"}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <span className="panel-label">{title}</span>
      <div className={previewSrc ? "upload-dropzone upload-dropzone-filled" : "upload-dropzone"}>
        {previewSrc ? (
          <>
            <img className="upload-preview-image" src={previewSrc} alt={fileName ?? title} />
            <strong>{fileName ?? emptyLabel}</strong>
          </>
        ) : (
          <>
            <div className="upload-plus-box" aria-hidden="true">
              +
            </div>
            <strong>{fileName ?? emptyLabel}</strong>
            <span className="upload-subtext">{t("uploadDropHint")}</span>
          </>
        )}
      </div>
      <p>{hint}</p>
      {fileError ? <span className="upload-error-text">{fileError}</span> : null}
      <input
        className="sr-only"
        type="file"
        accept=".jpg,.jpeg,.png"
        onChange={handleChange}
      />
    </label>
  );
}
