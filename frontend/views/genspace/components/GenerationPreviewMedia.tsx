import { useCallback, useLayoutEffect, useRef } from "react";

interface GenerationPreviewMediaProps {
  url: string;
  className: string;
}

export function GenerationPreviewMedia({
  url,
  className,
}: GenerationPreviewMediaProps) {
  const playbackPositionRef = useRef(0);
  const previousVideoRef = useRef<HTMLVideoElement | null>(null);
  const isMp4 = /\.mp4(?:\?|$)/i.test(url);
  const setVideoRef = useCallback((video: HTMLVideoElement | null) => {
    const previousVideo = previousVideoRef.current;
    if (
      previousVideo &&
      Number.isFinite(previousVideo.duration) &&
      previousVideo.duration > 0
    ) {
      playbackPositionRef.current =
        previousVideo.currentTime / previousVideo.duration;
    }
    previousVideoRef.current = video;
  }, []);

  useLayoutEffect(() => {
    if (!isMp4) playbackPositionRef.current = 0;
  }, [isMp4]);

  if (!isMp4) {
    return <img src={url} alt="Current generation preview" className={className} />;
  }

  return (
    <video
      key={url}
      ref={setVideoRef}
      src={url}
      className={className}
      autoPlay
      loop
      muted
      playsInline
      aria-label="Current generation preview"
      onLoadedMetadata={(event) => {
        const video = event.currentTarget;
        if (!Number.isFinite(video.duration) || video.duration <= 0) return;
        video.currentTime = playbackPositionRef.current * video.duration;
      }}
    />
  );
}
