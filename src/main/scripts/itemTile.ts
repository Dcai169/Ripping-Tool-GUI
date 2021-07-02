import { setVisibility } from './uiUtils.js';
// import { evaluateReplace } from './evaluateReplace.js';
import * as log from 'electron-log';

import { Destiny1Item } from './../../types/destiny1';
import { Destiny2Item } from './../../types/destiny2';

let itemContainer = $('#item-container');
let queue = $('#extract-queue');

export function createD2ItemTile(item: Destiny2Item) {
    let tileRoot = $('<div></div>', {
        class: 'item-tile d-flex align-items-center m-1',
        style: `position: relative; background-color: var(--${tierNumberToRarityName(item.inventory.tierType)}-color)`,
        id: item.hash,
        name: item.displayProperties.name ?? 'Classified',
        'data-index': item.index,
        'data-rarity': item.inventory.tierType,
        'data-itemtype': item.itemType,
        'data-itemsubtype': item.itemSubType,
        'data-ammotype': (item.hasOwnProperty('equippingBlock') && item.equippingBlock.hasOwnProperty('ammoType') ? item.equippingBlock.ammoType : '0'),
        on: {
            click: itemTileClickHandler
        }
    });

    // Image div (Icon & Season Badge)
    let imgDiv = $('<div></div>', {
        style: 'display: grid; position: relative;'
    });

    imgDiv.append($('<img></img>', {
        src: `https://bungie.net${item.displayProperties.icon}`,
        referrerpolicy: 'no-referrer',
        crossorigin: 'None',
        loading: 'lazy',
        style: 'grid-row: 1; grid-column: 1;'
    }));

    if (item.iconWatermark) {
        imgDiv.append($('<img></img>', {
            src: `https://bungie.net${item.iconWatermark}`,
            referrerpolicy: 'no-referrer',
            crossorigin: 'None',
            loading: 'lazy',
            style: 'grid-row: 1; grid-column: 1; z-index: 1;'
        }));
    }

    // Item text (Name & Type)
    let textDiv = $('<div></div>', {
        class: 'tile-text d-inline-flex px-2'
    });

    let textContainer = $('<div></div>', {});
    textContainer.append($('<p></p>', { class: 'm-0' }).append($(`<b></b>`, {
        text: (item.displayProperties.name ? item.displayProperties.name : `#${item.hash}`),
        style: `color: ${(item.inventory.tierType <= 2 ? 'black' : 'white')}`
    })));
    textContainer.append($('<p></p>', { class: 'm-0' }).append($('<i></i>', {
        text: (item.itemTypeDisplayName ? item.itemTypeDisplayName : undefined),
        class: 'fs-5 item-type',
        style: `color: ${(item.inventory.tierType <= 2 ? '#707070' : '#DDD')}`
    })));

    textDiv.append(textContainer);
    tileRoot.append(imgDiv);
    tileRoot.append(textDiv);
    return tileRoot;
}


export function createD1ItemTile(item: Destiny1Item) {
    let tileRoot = $('<div></div>', {
        class: 'item-tile d-flex align-items-center m-1',
        style: `position: relative; background-color: var(--${tierNumberToRarityName(item.tierType)}-color)`,
        id: item.hash,
        name: item.itemName ?? 'Classified',
        'data-index': item.index,
        'data-rarity': item.tierType,
        'data-itemtype': item.itemType,
        'data-itemsubtype': item.itemSubType,
        on: {
            click: itemTileClickHandler
        }
    });

    // Image div (Icon & Season Badge)
    let imgDiv = $('<div></div>', {
        style: 'display: grid; position: relative;'
    });

    imgDiv.append($('<img></img>', {
        src: `https://bungie.net${(item.icon ? item.icon : '/img/misc/missing_icon.png')}`,
        referrerpolicy: 'no-referrer',
        crossorigin: 'None',
        loading: 'lazy',
        style: 'grid-row: 1; grid-column: 1;'
    }));

    // Item text (Name & Type)
    let textDiv = $('<div></div>', {
        class: 'tile-text d-inline-flex px-2'
    });

    let textContainer = $('<div></div>', {});
    textContainer.append($('<p></p>', { class: 'm-0' }).append($(`<b></b>`, {
        text: (item.itemName ? item.itemName : `#${item.hash}`),
        class: 'm-0',
        style: `color: ${(item.tierType <= 2 ? 'black' : 'white')}`
    })));
    textContainer.append($('<p></p>', { class: 'm-0' }).append($('<i></i>', {
        text: (item.itemTypeName ? item.itemTypeName : undefined),
        class: 'fs-5 item-type',
        style: `color: ${(item.tierType <= 2 ? '#707070' : '#DDD')}`
    })));

    textDiv.append(textContainer);
    tileRoot.append(imgDiv);
    tileRoot.append(textDiv);
    return tileRoot;
}

function itemTileClickHandler(event: Event): void {
    let clicked = $(event.currentTarget) as JQuery<HTMLElement>;
    switch ($(event.currentTarget).eq(0).parents().attr('id')) {
        case 'item-container':
            log.silly(`${clicked.eq(0).attr('id')} added to queue`);
            queue.append(clicked.detach());
            break;

        case 'extract-queue':
            setVisibility(clicked);
            log.silly(`${clicked.eq(0).attr('id')} returned to container`);
            addItemToContainer(clicked.detach());
            break;

        default:
            break;
    }
}

export function addItemToContainer(item: JQuery<HTMLElement>) {
    let containerContents = [...itemContainer.eq(0).children()].map(item => { return parseInt(item.dataset.index) });
    if (item.data('index') < Math.min(...containerContents)) {
        $(`[data-index='${closest(item.data('index'), containerContents)}']`).before(item);
    } else {
        $(`[data-index='${closest(item.data('index'), containerContents)}']`).after(item);
    }
}

function tierNumberToRarityName(tierType: number) {
    switch (tierType) {
        case 6:
            return 'exotic';

        case 5:
            return 'legendary';

        case 4:
            return 'rare';

        case 3:
            return 'uncommon';

        case 2:
            return 'common';

        default:
            return '';
    }
}

// function that finds the closest value in a list of numbers
function closest(searchTarget: any, targetList: any[]) {
    return targetList.reduce((prev, curr) => {
        return (Math.abs(curr - searchTarget) < Math.abs(prev - searchTarget) ? curr : prev);
    });
}
