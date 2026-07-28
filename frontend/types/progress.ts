export type DownloadUnit = "bytes" | "files";

export interface DownloadTransferProgress {
  phase: string | null;
  source: string | null;
  repoId: string | null;
  filename: string | null;
  unit: DownloadUnit;
  current: number;
  total: number | null;
  percent: number | null;
  speedBps: number | null;
  etaSeconds: number | null;
  fileIndex: number | null;
  fileCount: number | null;
}

export interface ModelDownloadProgress extends DownloadTransferProgress {
  modelType: string | null;
  modelName: string | null;
}

export interface ModelPackProgress {
  status: "preparing" | "downloading" | "complete" | "cancelled" | "error";
  packId: string | null;
  packName: string | null;
  packIndex: number | null;
  packCount: number | null;
  message: string | null;
  transfer: DownloadTransferProgress | null;
}

export interface GenerationProgressResponse {
  status: string;
  phase: string;
  progress: number;
  currentStep: number | null;
  totalSteps: number | null;
  phaseIndex?: number | null;
  phaseCount?: number | null;
  sectionIndex?: number | null;
  sectionCount?: number | null;
  statusDetail?: string | null;
  previewUrl?: string | null;
  progressUnit?: DownloadUnit | null;
  modelDownload?: ModelDownloadProgress | null;
  downloadCurrentFile?: string | null;
  downloadCurrentFileProgress?: number | null;
  downloadTotalProgress?: number | null;
}
