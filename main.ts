
import { BrowserWindow, dialog, ipcMain } from 'electron';
import * as path from 'path';
import Finder from './src/find';
//import electronReload from 'electron-reload';
import stringSimilarity from "string-similarity";
import { FilesConverter } from './src/types/files_convert';
import { OnlineConverter } from './src/online-converter';

export default class Main {
  static mainWindow: Electron.BrowserWindow;
  static application: Electron.App;
  static BrowserWindow;
  private static onWindowAllClosed() {
    if (process.platform !== 'darwin') {
      Main.application.quit();
    }
  }

  private static onClose() {
    // Dereference the window object. 
    Main.mainWindow = null;
  }

  private static onReady() {

    //electronReload(path.join(__dirname), { electron: path.join(__dirname, '/../', 'node_modules', '.bin', 'electron.cmd') });

    Main.mainWindow = new Main.BrowserWindow({
      width: 800, height: 600, webPreferences: {
        preload: path.join(__dirname, 'preload.js')
      }
    });
    Main.mainWindow
      .loadURL('file://' + __dirname + '/../index.html');

    ipcMain.on('converter', async (event, arg: FilesConverter) => {
      const finder = new Finder();
      const onlineConverter = new OnlineConverter();
      console.log(arg.sub);
      if (arg.sub == "null") {
        arg.sub = null;
      }

      if (arg.video == "null") {
        arg.video = null;
      }

      let mkvFiles = arg.video

      if (arg.sound) { mkvFiles = await finder.mergeMkv(arg.video, arg.sound) };

      onlineConverter.progress((procent) => {
        Main.mainWindow.webContents.send('progress', `Завантажено: ${procent}%`);
      });

      onlineConverter.progressConverter((procent) => {
        Main.mainWindow.webContents.send('progress', `Прогрес конвертації: ${procent}%`);
      });

      const dir = path.dirname(arg.video);

      const file = await onlineConverter.run(mkvFiles, dir, arg.sub);

      console.log(mkvFiles);
      Main.mainWindow.webContents.send('finish', file);
    });

    ipcMain.on('select-dirs', async (event, arg) => {
      const result = await dialog.showOpenDialog(Main.mainWindow, {
        properties: ['openDirectory']
      })
      //mainWindow.webContents.postMessage('main-world-port', "xz", [port1])

      //mainWindow.webContents.postMessage('main-world-port', "xz", [port1])

      const finder = new Finder();

      const videos = await finder.findFileByExt(result.filePaths[0], 'mkv');

      const sounds = await finder.findFileByExt(result.filePaths[0], 'flac');

      const subs = await finder.findFileByExt(result.filePaths[0], 'ass');

      console.log(sounds);

      const files: FilesConverter = {
        video: null,
        sound: null,
        sub: null,
      }

      if (videos.length) {
        files.video = videos[0];
      }

      if (sounds.length) {
        //let titlesName = sounds.map((t: any) => finder.trim(t.name))

        let matches = stringSimilarity.findBestMatch("звук Звук",
          sounds
        );

        files.sound = sounds[matches.bestMatchIndex];
      }

      if (subs.length) {
        let matches = stringSimilarity.findBestMatch("написи sign",
          subs
        );

        files.sub = subs[matches.bestMatchIndex];
      }

      Main.mainWindow.webContents.send('custom-endpoint', files);

    })

    //Main.mainWindow.webContents.openDevTools();
    Main.mainWindow.on('closed', Main.onClose);
  }

  static main(app: Electron.App, browserWindow: typeof BrowserWindow) {
    // we pass the Electron.App object and the  
    // Electron.BrowserWindow into this function 
    // so this class has no dependencies. This 
    // makes the code easier to write tests for 
    Main.BrowserWindow = browserWindow;
    Main.application = app;
    Main.application.on('window-all-closed', Main.onWindowAllClosed);
    Main.application.on('ready', Main.onReady);
  }
} 