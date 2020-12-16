'use strict';

// Electronのモジュール
const electron = require("electron");

// アプリケーションをコントロールするモジュール
const app = electron.app;

// ウィンドウを作成するモジュール
const BrowserWindow = electron.BrowserWindow;

// メインウィンドウはGCされないようにグローバル宣言
let mainWindow;

// 全てのウィンドウが閉じたら終了(MACは除外)
app.on('window-all-closed', function() {
    if (process.platform != 'darwin') {
        app.quit();
    }
});

// Electronの初期化完了後に実行
app.on('ready', function() {
    // メイン画面表示
    mainWindow = new BrowserWindow({width: 800, height: 600,
                   webPreferences: { 
                       nodeIntegration: true,
                   }
               });
    mainWindow.loadURL('file://' + __dirname + '/index.html');

    // ウィンドウが閉じられたらアプリも終了
    mainWindow.on('closed', function() {
        mainWindow = null;
    });
});

// 同期IPCメッセージの受信と返信(レンダラプロセスから送られる)
electron.ipcMain.on('synchronous-message', (event, arg) => {
    // ここにレポートファイルのパスを定義する
    event.returnValue = app.getAppPath() + "\\sampleReport";
})
