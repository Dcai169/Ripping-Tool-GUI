import { app, BrowserWindow, ipcMain, dialog, Menu, MenuItem, shell } from 'electron';
import * as log from 'electron-log';
import * as store from 'electron-store';
import { debugInfo, is } from 'electron-util';
import { download } from 'electron-dl';
import { extract7zip, findExecutable } from './loading/loadingScripts';
import { logError, userPreferences } from './userPreferences';
import * as fs from 'fs';
import * as path from 'path';
import { downloadRes } from './types/downloadRes';
// import { GitHubAsset } from './types/github';

store.initRenderer();
log.info(debugInfo());

// Update stuff
// const updateServer = 'https://hazel-six-omega.vercel.app'
// const updateUrl = `${updateServer}/update/${process.platform}/${app.getVersion()}`

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
    app.quit();
}

const createMainWindow = () => {
    log.verbose('Main window spawned');

    // Create the browser window.
    const mainWindow = new BrowserWindow({
        width: 1600,
        height: 1000,
        webPreferences: {
            contextIsolation: false,
            nodeIntegration: true,
            enableRemoteModule: true
        }
    });

    mainWindow.maximize();

    // Menu items
    const mainMenu = new Menu();
    mainMenu.append(new MenuItem({
        label: 'File',
        submenu: [
            {
                role: 'reload',
                accelerator: 'CmdOrCtrl+R',
                click: () => { mainWindow.webContents.send('reload', true) }
            },
            {
                role: 'forceReload',
                accelerator: 'CmdOrCtrl+Shift+R',
                click: () => { mainWindow.webContents.send('force-reload', true) }
            },
            {
                role: 'toggleDevTools',
                accelerator: 'CmdOrCtrl+Shift+I',
                click: () => { mainWindow.getBrowserView().webContents.openDevTools() }
            },
            {
                role: 'quit',
                accelerator: 'CmdOrCtrl+Q',
                click: () => { app.quit() }
            }
        ]
    }));

    Menu.setApplicationMenu(mainMenu);

    app.once('browser-window-created', () => {
        mainWindow.webContents.send('system-locale', app.getLocale());
        mainWindow.webContents.send('app-version', app.getVersion());
    });

    // and load the index.html of the app.
    mainWindow.loadFile('./dist/main/index.html');

    // Hide menubar
    mainWindow.setMenuBarVisibility(false);

    // Open the DevTools.
    // mainWindow.webContents.openDevTools();
};

const createLoadingWindow = () => {
    log.verbose('Loading window spawned');

    const loadingWindow = new BrowserWindow({
        width: 400,
        height: 250,
        frame: false,
        webPreferences: {
            contextIsolation: false,
            nodeIntegration: true,
            enableRemoteModule: true
        }
    });

    // Menu items
    const loadingMenu = new Menu();
    loadingMenu.append(new MenuItem({
        label: 'File',
        submenu: [{
            role: 'toggleDevTools',
            accelerator: 'CmdOrCtrl+Shift+I',
            click: () => { loadingWindow.getBrowserView().webContents.openDevTools() }
        },
        {
            role: 'quit',
            accelerator: 'CmdOrCtrl+Q',
            click: () => { app.quit() }
        }]
    }));

    Menu.setApplicationMenu(loadingMenu);

    // Set window as non resizable and non closeable
    loadingWindow.setResizable(false);
    loadingWindow.setClosable(false);

    // and load the index.html of the app.
    loadingWindow.loadFile('./dist/loading/index.html');

    // Hide menubar
    loadingWindow.setMenuBarVisibility(false);

    // Open the DevTools.
    // loadingWindow.webContents.openDevTools();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
    createLoadingWindow();
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
        createMainWindow();
    }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
function dlDoneCallback(res: downloadRes) {
    let archivePath = res.path;
    let binDir = path.parse(archivePath).dir;
    extract7zip(archivePath).then((res) => {
        let toolPath = path.join(binDir, findExecutable(binDir).name);
        fs.unlink(archivePath, () => {
            fs.chmod(toolPath, 0o744, () => {
                setTimeout(() => {
                    BrowserWindow.getFocusedWindow().webContents.send('dlFinish', toolPath);
                }, 200);
            });
        });
    }).catch(logError);
}

ipcMain.on('loadingDone', (event, args) => {
    createMainWindow();
    BrowserWindow.fromId(event.frameId).destroy();
    log.verbose('Loading window destroyed');
});

ipcMain.on('dlStart', (event, { url, dlPath }) => {
    if (event.sender.getURL().includes('loading')) {
        download(BrowserWindow.fromId(event.frameId), url, { directory: dlPath, saveAs: false, onCompleted: dlDoneCallback }).catch(logError);
    }
});

ipcMain.on('selectOutputPath', (event) => {
    event.reply('selectOutputPath-reply', dialog.showOpenDialogSync({ title: 'Select Output Path', buttonLabel: 'Select', properties: ['openDirectory', 'createDirectory', 'dontAddToRecent', 'showHiddenFiles'], defaultPath: (userPreferences.get('outputPath') as string) }))
});

ipcMain.on('selectToolPath', (event) => {
    event.reply('selectToolPath-reply', dialog.showOpenDialogSync({ title: 'Select Tool Path', buttonLabel: 'Select', filters: [{ name: 'Executable Files', extensions: [(is.windows ? 'exe' : '')] }], properties: ['openFile', 'dontAddToRecent', 'showHiddenFiles'], defaultPath: (userPreferences.get('toolPath') as string) }))
});

ipcMain.on('restart', (_, args) => {
    if (args) {
        app.relaunch();
        app.exit();
    }
});

ipcMain.on('updateRequest', (_, args) => {
    let binDir = path.parse(args).dir
    fs.rmdirSync(binDir, { recursive: true });
    fs.mkdirSync(binDir);
});

ipcMain.on('openExplorer', (_, args) => {
    if (args) {
        shell.openPath(args[0]);
    }
});

