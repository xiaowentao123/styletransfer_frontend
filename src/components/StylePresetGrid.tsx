import { PresetStyle } from "../data/mock";
import { presetImageMap } from "../assets/presetImages";

type StylePresetGridProps = {
  styles: PresetStyle[];
  selectedId?: string;
  onSelect: (id: string) => void;
  getName: (style: PresetStyle) => string;
  getDescription: (style: PresetStyle) => string;
};

export function StylePresetGrid({
  styles,
  selectedId,
  onSelect,
  getName,
  getDescription,
}: StylePresetGridProps) {
  return (
    <div className="preset-grid">
      {styles.map((style) => (
        <button
          key={style.id}
          type="button"
          className={selectedId === style.id ? "preset-card selected" : "preset-card"}
          onClick={() => onSelect(style.id)}
        >
          <img
            className="preset-thumb preset-thumb-image"
            src={presetImageMap[style.nameKey]}
            alt={getName(style)}
          />
          <div className="preset-meta">
            <strong>{getName(style)}</strong>
            <p>{getDescription(style)}</p>
          </div>
        </button>
      ))}
    </div>
  );
}
