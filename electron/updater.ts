import { autoUpdater, UpdateDownloadedEvent } from 'electron-updater';
import { logger } from './logger';

export type UpdateChannel = 'latest' | 'beta' | 'alpha'

export function initAutoUpdater(
  channel: UpdateChannel = 'latest'
): void {
  if (channel !== 'latest') {
    autoUpdater.channel = channel
    autoUpdater.allowPrerelease = true
  }

  autoUpdater.on('update-downloaded', async (info: UpdateDownloadedEvent) => {
    logger.info( `[updater] Update downloaded: v${info.version}, installing update...`)
    autoUpdater.quitAndInstall(false, true)
  })

  const update = () => {
    logger.info( 'Checking for update...');
    autoUpdater.checkForUpdatesAndNotify().catch((e) => {
      logger.error( `Failed checking for updates: ${e}`);
    });
  }

  // Check after startup, then periodically
  setTimeout(update, 5_000);
  setInterval(update, 4 * 60 * 60 * 1000);
}
