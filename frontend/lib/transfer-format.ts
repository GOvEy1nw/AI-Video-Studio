export function formatBytes(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value) || value <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
  const digits = index < 2 ? 1 : value / 1024 ** index < 10 ? 2 : 1;
  return `${(value / 1024 ** index).toFixed(digits)} ${units[index]}`;
}

export function formatTransferRate(value: number | null | undefined): string {
  return value != null && Number.isFinite(value) && value > 0
    ? `${formatBytes(value)}/s`
    : "";
}

export function formatEta(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value) || value < 0) return "";
  let seconds = Math.round(value);
  const hours = Math.floor(seconds / 3600);
  seconds %= 3600;
  const minutes = Math.floor(seconds / 60);
  seconds %= 60;
  if (hours) return `${hours}h ${String(minutes).padStart(2, "0")}m`;
  if (minutes) return `${minutes}m ${String(seconds).padStart(2, "0")}s`;
  return `${seconds}s`;
}

export function clampPercent(value: number | null | undefined): number | null {
  return value == null || !Number.isFinite(value)
    ? null
    : Math.max(0, Math.min(100, value));
}
