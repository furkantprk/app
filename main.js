const { app, BrowserWindow, Menu, ipcMain } = require('electron');

let win;
let addressWindow;
let cartWindow;
let addresses = [];
let cart = [];

async function initializeStore() {
    const Store = (await import('electron-store')).default;
    const store = new Store();
    addresses = store.get('addresses') || [];

    function saveAddresses() {
        store.set('addresses', addresses);
    }

    function saveCart() {
        store.set('cart', cart);
    }

    ipcMain.on('add-address', (event, { address, type }) => {
        addresses.push({ address, type });
        saveAddresses();
        console.log('Address added:', address, type);
    });

    ipcMain.on('delete-address', (event, addressToDelete) => {
        addresses = addresses.filter(({ address }) => address !== addressToDelete);
        saveAddresses();
        console.log('Address deleted:', addressToDelete);
    });

    ipcMain.on('request-addresses', (event) => {
        event.sender.send('load-addresses', addresses);
    });

    ipcMain.on('wb', (event, data) => {
        console.log('opened:', data);
    });

    ipcMain.on('room', (event, data) => {
        console.log('opened:', data);
    });

    ipcMain.on('bd', (event, data) => {
        console.log('opened:', data);
    });

    ipcMain.on('tulips', (event, data) => {
        console.log('opened:', data);
    });

    ipcMain.on('add-to-cart', (event, item) => {
        const existingItem = cart.find(cartItem => cartItem.id === item.id);
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({ ...item, quantity: 1 });
        }
        saveCart();
        console.log('Item added to cart:', item);
    });

    ipcMain.on('update-cart', (event, updatedCart) => {
        cart = updatedCart;
        saveCart();
        if (cartWindow) {
            cartWindow.webContents.send('load-cart', cart);
        }
    });

    ipcMain.on('clear-cart', () => {
        cart = [];
        saveCart();
        if (cartWindow) {
            cartWindow.webContents.send('load-cart', cart);
        }
        cartWindow.webContents.send('cart-cleared');
    });

    ipcMain.on('open-cart', () => {
        if (!cartWindow) {
            createCartWindow();
        } else {
            cartWindow.show();
            cartWindow.webContents.send('load-cart', cart);
        }
    });

    ipcMain.on('place-order', () => {
        console.log('Order received');
    });

    cart = store.get('cart') || [];
}

function createAddressWindow() {
    addressWindow = new BrowserWindow({
        width: 400,
        height: 300,
        parent: win,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true,
        }
    });

    addressWindow.loadURL(`file://${__dirname}/addresses.html`);

    addressWindow.on('closed', () => {
        addressWindow = null;
    });
}

function createCartWindow() {
    cartWindow = new BrowserWindow({
        width: 400,
        height: 600,
        parent: win,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true,
        }
    });

    cartWindow.loadURL(`file://${__dirname}/shopping-cart.html`);

    cartWindow.on('closed', () => {
        cartWindow = null;
    });

    cartWindow.webContents.on('did-finish-load', () => {
        cartWindow.webContents.send('load-cart', cart);
    });
}

function createWindow() {
    win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true,
        }
    });

    win.loadURL(`file://${__dirname}/main.html`);

    win.on('closed', () => {
        win = null;
    });
}

app.on('ready', async () => {
    await initializeStore();
    createWindow();
    const mainMenu = Menu.buildFromTemplate(mainMenuTemplate);
    Menu.setApplicationMenu(mainMenu);
});

const mainMenuTemplate = [
    {
        label: "Create",
        submenu: [
            {
                label: "Addresses",
                click() {
                    if (!addressWindow) {
                        createAddressWindow();
                    } else {
                        addressWindow.show();
                    }
                }
            },
        ]
    },
    {
        label: "DevTools",
        submenu: [
            {
                label: "Open DevTools",
                click(item, focussedWindow) {
                    focussedWindow.toggleDevTools();
                }
            }
        ]
    },
    {
        label: "Back",
        click() {
            win.webContents.goBack();
        },
    },
    {
        label: "Quit",
        role: "quit",
        accelerator: "Ctrl+Q"
    },
];

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (win === null) {
        createWindow();
    }
});
