export function AspectIcon({
  ratio = "16:9",
  className,
}: {
  ratio?: string;
  className?: string;
}) {
  const [rawWidth, rawHeight] = ratio.split(":").map(Number);
  const width = Number.isFinite(rawWidth) && rawWidth > 0 ? rawWidth : 16;
  const height = Number.isFinite(rawHeight) && rawHeight > 0 ? rawHeight : 9;
  const scale = Math.min(16 / width, 12 / height);
  const rectWidth = width * scale;
  const rectHeight = height * scale;

  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
      data-aspect-ratio={ratio}
    >
      <rect
        x={(24 - rectWidth) / 2}
        y={(24 - rectHeight) / 2}
        width={rectWidth}
        height={rectHeight}
        rx="1.5"
      />
    </svg>
  );
}
