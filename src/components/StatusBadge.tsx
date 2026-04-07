import { useTranslate } from "../context/AppContext";
import { TaskStatus } from "../data/mock";

type StatusBadgeProps = {
  status: TaskStatus;
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const { t } = useTranslate();

  const labelMap = {
    idle: t("taskIdle"),
    processing: t("taskProcessing"),
    completed: t("taskCompleted"),
    failed: t("taskFailed"),
  };

  return <span className={`status-badge status-${status}`}>{labelMap[status]}</span>;
}
