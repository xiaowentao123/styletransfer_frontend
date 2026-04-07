export type PresetStyle = {
  id: string;
  nameKey: "ink" | "impression" | "cyber" | "oil";
  accent: string;
};

export type TaskStatus = "idle" | "processing" | "completed" | "failed";

export type HistoryRecord = {
  id: string;
  title: string;
  status: Exclude<TaskStatus, "idle">;
  createdAt: string;
  styleName: string;
  summary: string;
  contentImage?: string;
  styleImage?: string;
  resultImage?: string;
  strength?: number;
  preserveStructure?: boolean;
};

export const presetStyles: PresetStyle[] = [
  { id: "ink", nameKey: "ink", accent: "linear-gradient(135deg, #0f172a, #334155)" },
  { id: "impression", nameKey: "impression", accent: "linear-gradient(135deg, #f59e0b, #ef4444)" },
  { id: "cyber", nameKey: "cyber", accent: "linear-gradient(135deg, #0ea5e9, #22c55e)" },
  { id: "oil", nameKey: "oil", accent: "linear-gradient(135deg, #7c2d12, #c2410c)" },
];

export const defaultHistoryRecords: HistoryRecord[] = [
  {
    id: "task-240401",
    title: "城市街景风格化",
    status: "completed",
    createdAt: "2026-04-05 10:24",
    styleName: "印象派",
    summary: "结果已生成，可直接下载。",
  },
  {
    id: "task-240325",
    title: "人物肖像实验",
    status: "processing",
    createdAt: "2026-04-05 09:41",
    styleName: "水墨写意",
    summary: "任务仍在执行中，预计很快完成。",
  },
  {
    id: "task-240301",
    title: "建筑照片迁移",
    status: "failed",
    createdAt: "2026-04-04 21:17",
    styleName: "赛博霓虹",
    summary: "风格图尺寸异常，任务已终止。",
  },
];
