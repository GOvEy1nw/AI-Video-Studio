import { GenSpaceWorkspace } from "./genspace/GenSpaceWorkspace";

export function GenSpace({
  isActive,
  showReferences = false,
}: {
  isActive: boolean;
  showReferences?: boolean;
}) {
  return (
    <GenSpaceWorkspace
      isActive={isActive}
      showReferences={showReferences}
    />
  );
}
