import {
  app,
  Menu,
  dialog,
  ipcMain,
  session,
  nativeTheme,
  BrowserWindow,
} from 'electron';

import Store from 'electron-store';
import log from 'electron-log';
import { autoUpdater } from 'electron-updater';
import { searchDevtools } from 'electron-search-devtools';

import path from 'node:path';
import mime from 'mime-types';
import i18next from 'i18next';

import { createMenu } from './createMenu';
import { setLocales } from './setLocales';
import { mkico, mkicns } from './mkicons';

const store = new Store<StoreType>({
  configFileMode: 0o666,
  defaults: {
    ico: true,
    desktop: true,
    x: undefined,
    y: undefined,
    quality: 2,
    bmp: true,
    ask: true,
  },
});

/// #if DEBUG
const execPath =
  process.platform === 'win32'
    ? '../node_modules/electron/dist/electron.exe'
    : '../node_modules/.bin/electron';

// eslint-disable-next-line @typescript-eslint/no-var-requires
require('electron-reload')(__dirname, {
  electron: path.resolve(__dirname, execPath),
});
/// #endif

const isLinux = process.platform === 'linux';
const isDarwin = process.platform === 'darwin';
const isDevelop = process.env.NODE_ENV === 'development';
const gotTheLock = app.requestSingleInstanceLock();

const getResourceDirectory = () => {
  return isDevelop
    ? path.join(process.cwd(), 'dist')
    : path.join(process.resourcesPath, 'app.asar.unpacked', 'dist');
};

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    x: store.get('x'),
    y: store.get('y'),
    width: isDarwin ? 360 : 400,
    height: isDarwin ? 320 : 340,
    show: false,
    autoHideMenuBar: true,
    titleBarStyle: isDarwin ? 'hidden' : 'default',
    icon: isLinux
      ? path.join(getResourceDirectory(), 'images/icon.png')
      : undefined,
    resizable: false,
    maximizable: false,
    fullscreenable: false,
    backgroundColor: '#005bea',
    webPreferences: {
      safeDialogs: true,
      devTools: isDevelop,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  nativeTheme.themeSource = nativeTheme.shouldUseDarkColors ? 'dark' : 'light';

  ipcMain.handle('mime-check', (_e, filepath) => mime.lookup(filepath));
  ipcMain.handle('make-ico', (_e, filepath) => mkico(filepath, store));
  ipcMain.handle('make-icns', (_e, filepath) => mkicns(filepath, store));

  ipcMain.handle('open-file-dialog', async () => {
    return dialog
      .showOpenDialog(mainWindow, {
        properties: ['openFile'],
        title: i18next.t('Select a PNG File'),
        filters: [
          {
            name: 'PNG file',
            extensions: ['png'],
          },
        ],
      })
      .then((result) => {
        if (result.canceled) return;
        return result.filePaths[0];
      })
      .catch((err) => console.log(err));
  });

  const menu = createMenu(mainWindow, store);
  Menu.setApplicationMenu(menu);

  ipcMain.on('show-context-menu', () => {
    menu.popup();
  });

  if (isDevelop) {
    searchDevtools('REACT')
      .then((devtools) => {
        session.defaultSession.loadExtension(devtools, {
          allowFileAccess: true,
        });
      })
      .catch((err) => console.log(err));
  }

  if (isDarwin || isLinux) {
    autoUpdater.logger = log;
    autoUpdater.autoDownload = false;

    if (store.get('ask')) autoUpdater.checkForUpdates();

    autoUpdater.on('update-available', () => {
      dialog
        .showMessageBox(mainWindow, {
          message: i18next.t('Found Updates'),
          detail:
            i18next.t('A new version is available.') +
            '\n' +
            i18next.t('Do you want to download it now?'),
          buttons: [i18next.t('Not now'), 'OK'],
          defaultId: 1,
          cancelId: 0,
          checkboxLabel: i18next.t('No update notifications required.'),
        })
        .then((result) => {
          if (result.response === 1) {
            log.info('User chose to update...');
            autoUpdater.downloadUpdate();
          } else {
            log.info('User refused to update...');
            if (result.checkboxChecked) {
              log.info('User rejected the update notification.');
              store.set('ask', false);
            }
          }
        });
    });

    autoUpdater.on('update-not-available', () => {
      log.info('No updates available.');
    });

    autoUpdater.on('update-downloaded', () => {
      log.info('Updates downloaded...');
      dialog
        .showMessageBox(mainWindow, {
          message: i18next.t('Install Updates'),
          detail:
            i18next.t('Updates downloaded.') +
            '\n' +
            i18next.t('Please restart Elephicon...'),
        })
        .then(() => {
          setImmediate(() => autoUpdater.quitAndInstall());
        })
        .catch((err) => log.info(`Updater Error: ${err}`));
    });
  }

  mainWindow.loadFile('dist/index.html');
  mainWindow.once('ready-to-show', () => {
    if (isDevelop) {
      mainWindow.webContents.openDevTools({ mode: 'detach' });
    }
    mainWindow.show();
  });

  mainWindow.webContents.once('did-finish-load', () => {
    mainWindow.webContents.send('set-desktop', store.get('desktop'));
  });

  mainWindow.once('close', () => {
    const bounds = mainWindow.getBounds();
    store.set('x', bounds.x);
    store.set('y', bounds.y);
  });
};

if (!gotTheLock && !isDarwin) {
  app.exit();
} else {
  app.whenReady().then(() => {
    const locale = store.get('language') || app.getLocale();
    setLocales(locale);
    store.set('language', locale);

    createWindow();
  });

  app.setAboutPanelOptions({
    applicationName: app.name,
    applicationVersion: isDarwin
      ? app.getVersion()
      : `v${app.getVersion()} (${process.versions['electron']})`,
    version: process.versions['electron'],
    iconPath: path.join(getResourceDirectory(), 'images/icon.png'),
    copyright: '© 2020 sprout2000 and other contributors',
  });

  app.once('window-all-closed', () => app.exit());
}
