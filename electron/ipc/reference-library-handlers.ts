import { ipcMain } from "electron";
import {
  deleteReferenceEntity,
  discardStagedReferenceImage,
  listReferenceEntities,
  saveReferenceEntity,
  stageGeneratedReferenceImage,
} from "../reference-library-storage";
import type { SaveReferenceEntityInput } from "../../shared/reference-library";

export function registerReferenceLibraryHandlers(): void {
  ipcMain.handle("list-reference-entities", () => listReferenceEntities());
  ipcMain.handle("save-reference-entity", (_event, input: SaveReferenceEntityInput) =>
    saveReferenceEntity(input),
  );
  ipcMain.handle("delete-reference-entity", (_event, id: string) =>
    deleteReferenceEntity(id),
  );
  ipcMain.handle("stage-generated-reference-image", (_event, sourcePath: string, draftId: string) =>
    stageGeneratedReferenceImage(sourcePath, draftId),
  );
  ipcMain.handle("discard-staged-reference-image", (_event, sourcePath: string) =>
    discardStagedReferenceImage(sourcePath),
  );
}
