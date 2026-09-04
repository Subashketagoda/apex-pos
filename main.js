const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');
const http = require('http');
const fs = require('fs');

let mainWindow;
let customerWindow;
let server;
let serverPort = 0;

const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

function startLocalServer(callback) {
    server = http.createServer((req, res) => {
        const cleanUrl = req.url.split('?')[0];
        let filePath = path.join(__dirname, cleanUrl === '/' ? 'login.html' : cleanUrl);

        fs.readFile(filePath, (err, content) => {
            if (err) {
                if (err.code === 'ENOENT') {
                    res.writeHead(404, { 'Content-Type': 'text/plain' });
                    res.end('404 File Not Found');
                } else {
                    res.writeHead(500, { 'Content-Type': 'text/plain' });
                    res.end(`Internal Server Error: ${err.code}`);
                }
            } else {
                const ext = path.extname(filePath).toLowerCase();
                const contentType = MIME_TYPES[ext] || 'application/octet-stream';
                res.writeHead(200, { 
                    'Content-Type': contentType,
                    'Access-Control-Allow-Origin': '*'
                });
                res.end(content, 'utf-8');
            }
        });
    });

    server.listen(0, '127.0.0.1', () => {
        serverPort = server.address().port;
        console.log(`[ApexPOS Server] Serving at http://localhost:${serverPort}`);
        callback(serverPort);
    });
}

function createWindow(port) {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        minWidth: 1024,
        minHeight: 768,
        title: "ApexPOS - Professional Retail Management",
        autoHideMenuBar: true,
        webPreferences: {
            nodeIntegration: true, // Enable node integration for IPC communication
            contextIsolation: false,
            sandbox: false
        }
    });

    mainWindow.loadURL(`http://localhost:${port}/login.html`);
    mainWindow.setMenuBarVisibility(false);

    // Register hotkeys
    mainWindow.webContents.on('before-input-event', (event, input) => {
        if (input.key === 'F11' && input.type === 'keyDown') {
            mainWindow.setFullScreen(!mainWindow.isFullScreen());
            event.preventDefault();
        }
        if ((input.key === 'F12' || (input.control && input.shift && input.key.toLowerCase() === 'i')) && input.type === 'keyDown') {
            mainWindow.webContents.toggleDevTools();
            event.preventDefault();
        }
        if ((input.key === 'F5' || (input.control && input.key.toLowerCase() === 'r')) && input.type === 'keyDown') {
            mainWindow.reload();
            event.preventDefault();
        }
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
        if (customerWindow) {
            customerWindow.close();
            customerWindow = null;
        }
    });
}

function createCustomerWindow() {
    if (customerWindow) {
        customerWindow.focus();
        return;
    }

    const displays = screen.getAllDisplays();
    const externalDisplay = displays.find((display) => {
        return display.bounds.x !== 0 || display.bounds.y !== 0;
    });

    if (externalDisplay) {
        // Open on secondary monitor
        customerWindow = new BrowserWindow({
            x: externalDisplay.bounds.x,
            y: externalDisplay.bounds.y,
            width: externalDisplay.bounds.width,
            height: externalDisplay.bounds.height,
            fullscreen: true,
            frame: false,
            autoHideMenuBar: true,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false,
                sandbox: false
            }
        });
    } else {
        // Open in windowed mode on main screen for testing if only one display
        customerWindow = new BrowserWindow({
            width: 800,
            height: 600,
            title: "ApexPOS - Customer Display (Test Window)",
            autoHideMenuBar: true,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false,
                sandbox: false
            }
        });
    }

    customerWindow.loadURL(`http://localhost:${serverPort}/customer.html`);
    
    customerWindow.on('closed', () => {
        customerWindow = null;
    });
}

// IPC Communications
ipcMain.on('set-auto-launch', (event, enabled) => {
    app.setLoginItemSettings({
        openAtLogin: enabled,
        path: app.getPath('exe')
    });
    console.log(`[Auto-Launch] Open at Login set to: ${enabled}`);
});

ipcMain.handle('get-auto-launch', async () => {
    const settings = app.getLoginItemSettings();
    return settings.openAtLogin;
});

ipcMain.on('toggle-customer-display', (event, enabled) => {
    console.log(`[Customer Display] Toggled to: ${enabled}`);
    if (enabled) {
        createCustomerWindow();
    } else {
        if (customerWindow) {
            customerWindow.close();
            customerWindow = null;
        }
    }
});

ipcMain.on('update-customer-display', (event, data) => {
    if (customerWindow && !customerWindow.isDestroyed()) {
        customerWindow.webContents.send('update-customer-display', data);
    }
});

ipcMain.on('print-silent', (event, txnId) => {
    console.log(`[Silent Print] Request received for transaction: ${txnId}`);
    const workerWindow = new BrowserWindow({
        show: false,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    workerWindow.loadURL(`http://localhost:${serverPort}/receipt.html?id=${txnId}`);

    workerWindow.webContents.on('did-finish-load', () => {
        // Give local storage / firestore 800ms to resolve and render the receipt
        setTimeout(() => {
            workerWindow.webContents.print({ silent: true }, (success, errorType) => {
                if (success) {
                    console.log(`[Silent Print] Successfully printed transaction: ${txnId}`);
                } else {
                    console.error(`[Silent Print] Failed printing transaction: ${txnId}. Error: ${errorType}`);
                }
                workerWindow.destroy();
            });
        }, 800);
    });
});

ipcMain.on('print-kot-silent', (event, { htmlContent, silent }) => {
    console.log(`[Silent Print] Request received for KOT (silent: ${silent})`);
    const workerWindow = new BrowserWindow({
        show: false,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    workerWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(`
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body {
                    font-family: 'Courier New', monospace;
                    background: #fff;
                    color: #000;
                    margin: 0;
                    padding: 10px;
                    font-size: 14px;
                    width: 3in; /* Standard 3 inch / 80mm thermal width */
                }
            </style>
        </head>
        <body>
            ${htmlContent}
        </body>
        </html>
    `));

    workerWindow.webContents.on('did-finish-load', () => {
        setTimeout(() => {
            workerWindow.webContents.print({ silent: silent }, (success, errorType) => {
                if (success) {
                    console.log(`[Silent Print] Successfully printed KOT`);
                } else {
                    console.error(`[Silent Print] Failed printing KOT. Error: ${errorType}`);
                }
                workerWindow.destroy();
            });
        }, 300);
    });
});

// Single instance lock
const additionalData = { myKey: 'apexpos-single-instance' };
const isGotTheLock = app.requestSingleInstanceLock(additionalData);

if (!isGotTheLock) {
    app.quit();
} else {
    app.on('second-instance', (event, commandLine, workingDirectory, additionalData) => {
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.focus();
        }
    });

    app.whenReady().then(() => {
        startLocalServer((port) => {
            createWindow(port);
        });

        app.on('activate', () => {
            if (BrowserWindow.getAllWindows().length === 0) {
                createWindow(serverPort);
            }
        });
    });
}

app.on('window-all-closed', () => {
    if (server) {
        server.close();
    }
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
