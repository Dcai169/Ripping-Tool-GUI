// Module imports
import { api } from 'electron-util';
import { ipcRenderer } from 'electron';
import * as log from 'electron-log';
import * as path from 'path';
// const os = require('os');

// Script imports
import { getDestiny1ItemDefinitions, getDestiny2ItemDefinitions } from './scripts/destinyManifest.js';
import { createD1ItemTile, createD2ItemTile, addItemToContainer } from './scripts/itemTile.js';
import { setVisibility, updateUIInput, uiConsolePrint } from './scripts/uiUtils.js';
import { executeButtonClickHandler } from './scripts/toolWrapper.js';
import { baseFilterClickHandler, compositeFilterClickHandler, updateItems } from './scripts/filterMenus.js';
import { userPreferences } from './../userPreferences';
import { toolVersion, getReleaseAsset } from './../loading/loadingScripts';
import { GitHubAsset } from 'src/types/github.js';

// Document Objects
let itemContainer = $('#item-container');
let queue = $('#extract-queue');
let gameSelector = document.getElementById('gameSelector') as HTMLInputElement;

let searchDebounceTimeout: NodeJS.Timeout;
let reloadRequired = false;
let restartRequired = false;
let itemMap = [
    {

    },
    {
        get: getDestiny1ItemDefinitions,
        items: new Map()
    },
    {
        get: getDestiny2ItemDefinitions,
        items: new Map()
    }
]


uiConsolePrint(`DARE v${api.app.getVersion()}`);

function loadItems(itemMap: Map<number, any>): void {
    log.silly('Container cleared');
    itemContainer.empty();
    log.silly('Queue cleared');
    queue.empty();
    log.debug(`${itemMap.size} items indexed`);

    itemMap.forEach((item) => {
        if (gameSelector.value === '2') {
            itemContainer.append(createD2ItemTile(item));
        } else if (gameSelector.value === '1') {
            itemContainer.append(createD1ItemTile(item));
        }
    });
    log.debug(`${itemMap.size} items loaded`);
}

function searchBoxInputHandler(event: Event) {
    window.clearTimeout(searchDebounceTimeout);

    searchDebounceTimeout = setTimeout(() => {
        if ((event.target as HTMLInputElement).value) {
            log.silly(`Search: ${(event.target as HTMLInputElement).value.toLowerCase()}`);
            // There's a bug in here; probably some sort of race condition issue
            itemContainer.eq(0).children().each((_, element) => {
                let item = $(element);
                setVisibility(item);
            });
        } else {
            [...document.getElementsByClassName('base-filter')].forEach(updateItems);
        }
    }, 400);
}

function gameSelectorChangeListener(): void {
    if (itemMap[parseInt(gameSelector.value)].items && itemMap[parseInt(gameSelector.value)].items.size) {
        loadItems(itemMap[parseInt(gameSelector.value)].items);
    } else {
        itemMap[parseInt(gameSelector.value)].get((userPreferences.get('locale') as string)).then((res: Map<number, any>) => {
            itemMap[parseInt(gameSelector.value)].items = res;
            loadItems(res);
        });
    }
}

function signalUpdate() {
    ipcRenderer.send('updateRequest', userPreferences.get('toolPath'));
    document.getElementById('update-button').setAttribute('disabled', 'disabled');
    userPreferences.delete('toolPath');
    restartRequired = true;
    $('#modal-close-button').text('Restart');
}

window.addEventListener('DOMContentLoaded', (event) => {
    // Load userPreferences
    for (const [key, value] of userPreferences) {
        // log.debug(`${key}: ${value} (${typeof value})`);
        updateUIInput(key, value);
    }

    // Load items
    gameSelectorChangeListener();
});

// Navbar items
gameSelector.addEventListener('change', gameSelectorChangeListener);
[...document.getElementsByClassName('base-filter')].forEach((element) => { element.addEventListener('click', baseFilterClickHandler) });
[...document.getElementsByClassName('composite-filter')].forEach((element) => { element.addEventListener('click', compositeFilterClickHandler) });
document.getElementById('queue-clear-button').addEventListener('click', () => { [...queue.eq(0).children()].forEach(item => { addItemToContainer($(`#${item.id}`).detach()); }); log.silly('Queue cleared.'); });
document.getElementById('queue-execute-button').addEventListener('click', executeButtonClickHandler);
document.getElementById('search-box').addEventListener('input', searchBoxInputHandler);

// Console
document.getElementById('console-clear').addEventListener('click', () => { document.getElementById('console-text').textContent = '' });

// Settings modal
document.getElementById('outputPath').addEventListener('click', () => { ipcRenderer.send('selectOutputPath') });
document.getElementById('toolPath').addEventListener('click', () => { ipcRenderer.send('selectToolPath') });
document.getElementById('update-button').addEventListener('click', async (event) => {
    log.silly('Update button clicked');
    let res = await toolVersion((userPreferences.get('toolPath') as string));
    if (!res.stderr) {
        let version = res.stdout.substring(0, 5);
        getReleaseAsset()
            .then((res: GitHubAsset) => {
                if (version !== path.parse(res.browser_download_url).dir.split('/').pop().substring(1)) {
                    log.debug(`Downloading ${res.browser_download_url}`);
                    signalUpdate();
                }
            });
    } else {
        signalUpdate();
    }
});

document.getElementById('open-output').addEventListener('click', () => { ipcRenderer.send('openExplorer', [userPreferences.get('outputPath')]) })
document.getElementById('aggregateOutput').addEventListener('input', () => { userPreferences.set('aggregateOutput', (document.getElementById('aggregateOutput') as HTMLInputElement).checked) });
document.getElementById('locale').addEventListener('change', () => {
    reloadRequired = true;
    $('#modal-close-button').text('Reload');
    userPreferences.set('locale', (document.getElementById('locale') as HTMLInputElement).value);
});

document.getElementById('modal-close-button').addEventListener('click', () => {
    if (restartRequired) {
        ipcRenderer.send('restart', true);
    } else if (reloadRequired) {
        document.location.reload();
        reloadRequired = false;
    }
});

ipcRenderer.on('selectOutputPath-reply', (_, args) => {
    if (args) {
        userPreferences.set('outputPath', args[0]);
        (document.getElementById('outputPath') as HTMLInputElement).value = args[0];
    }
});

ipcRenderer.on('selectToolPath-reply', (_, args) => {
    if (args) {
        userPreferences.set('toolPath', args[0]);
        (document.getElementById('toolPath') as HTMLInputElement).value = args[0];
    }
});

// Keyboard shortcuts
ipcRenderer.on('reload', (_, args) => {
    if (args) {
        loadItems(itemMap[parseInt(gameSelector.value)].items);
    }
});

ipcRenderer.on('force-reload', (_, args) => {
    if (args) {
        document.location.reload();
    }
});
