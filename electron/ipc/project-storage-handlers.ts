import { ipcMain } from 'electron'
import {
  deleteStoredProject,
  loadStoredProjects,
  migrateLegacyProjects,
  saveStoredProject,
} from '../project-storage'

export function registerProjectStorageHandlers(): void {
  ipcMain.handle('projects-load', () => loadStoredProjects())
  ipcMain.handle('projects-save', (_event, project: unknown, position?: number) => saveStoredProject(project, position))
  ipcMain.handle('projects-delete', (_event, id: string) => deleteStoredProject(id))
  ipcMain.handle('projects-migrate-local-storage', (_event, projects: unknown[]) => migrateLegacyProjects(projects))
}
