// Module imports
import { api } from 'electron-util';
import { ipcRenderer } from 'electron';
import * as log from 'electron-log';
// const os = require('os');

// Script imports
import { getDestiny1ItemDefinitions, getDestiny2ItemDefinitions } from './scripts/destinyManifest.js';
import { createD1ItemTile, createD2ItemTile, addItemToContainer } from './scripts/itemTile.js';
import { setVisibility, updateUIInput, uiConsolePrint } from './scripts/uiUtils.js';
import { executeButtonClickHandler } from './scripts/toolWrapper.js';
import { baseFilterClickHandler, compositeFilterClickHandler, updateItems } from './scripts/filterMenus.js';
import { userPreferences } from '../userPreferences';

// Document Objects
let itemContainer = $('#item-container');
let queue = $('#extract-queue');
let gameSelector = document.getElementById('gameSelector') as HTMLInputElement;

let searchDebounceTimeout: NodeJS.Timeout;
let reloadRequired = false;
let itemMap = {
    '1': {
        get: getDestiny1ItemDefinitions,
        items: Map
    },
    '2': {
        get: getDestiny2ItemDefinitions,
        items: Map
    }
};

uiConsolePrint(`DARE v${api.app.getVersion()}`);

function loadItems(itemMap: Map<number, any>) {
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

function gameSelectorChangeListener() {
    if (itemMap[gameSelector.value].items) {
        loadItems(itemMap[gameSelector.value].items);
    } else {
        itemMap[gameSelector.value].get(userPreferences.get('locale')).then((res: Map<number, any>) => {
            itemMap[gameSelector.value].items = res;
            loadItems(res);
        });
    }
}

window.addEventListener('DOMContentLoaded', (event) => {
    // Load userPreferences
    for (const [key, value] of userPreferences) {
        // log.debug(`${key}: ${value} (${typeof value})`);
        updateUIInput(key, value);
    } 

    // Load items
    if (!itemMap[gameSelector.value].items) {
        itemMap[gameSelector.value].get(userPreferences.get('locale')).then((res: Map<number, any>) => {
            itemMap[gameSelector.value].items = res;
            loadItems(res);
        });
    }
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
document.getElementById('open-output').addEventListener('click', () => { ipcRenderer.send('openExplorer', [userPreferences.get('outputPath')]) })
document.getElementById('aggregateOutput').addEventListener('input', () => { userPreferences.set('aggregateOutput', (document.getElementById('aggregateOutput') as HTMLInputElement).checked) });
document.getElementById('locale').addEventListener('change', () => {
    reloadRequired = true;
    $('#modal-close-button').text('Reload');
    userPreferences.set('locale', (document.getElementById('locale') as HTMLInputElement).value);
});
document.getElementById('modal-close-button').addEventListener('click', () => {
    if (reloadRequired) {
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
        loadItems(itemMap[gameSelector.value].items);
    }
});

ipcRenderer.on('force-reload', (_, args) => {
    if (args) {
        document.location.reload();
    }
});