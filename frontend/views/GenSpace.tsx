import { GenSpaceWorkspace } from "./genspace/GenSpaceWorkspace";

export function GenSpace({ isActive }: { isActive: boolean }) {
  return <GenSpaceWorkspace isActive={isActive} />;
}
