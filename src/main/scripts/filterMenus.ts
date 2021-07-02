import { setVisibility } from './uiUtils.js';
// import * as log from 'electron-log';

function getFilterState() {
    let binState = '';
    [...document.getElementsByClassName('base-filter')].forEach((inputElem) => {
        binState += ((inputElem as HTMLInputElement).checked ? '1' : '0');
    });

    return binState.padStart(32, '0');
}

function setFilterState(binState: string) {
    [...document.getElementsByClassName('base-filter')].forEach((inputElem) => {
        (inputElem as HTMLInputElement).checked = (binState.charAt(31 - parseInt((inputElem as  HTMLElement).dataset.index)) === '1' ? true : false);
        updateItems((inputElem as HTMLElement));
    });
    updateCompositeCheckboxes(getFilterState());
}

export function updateItems(inputElem: EventTarget) {
    setVisibility($(`#item-container ${(inputElem as HTMLElement).dataset.selector}`));
}

export function baseFilterClickHandler(event: Event) {
    updateItems(event.target);
    updateCompositeCheckboxes(getFilterState());
}

export function compositeFilterClickHandler(event: Event) {
    setFilterState([...getFilterState().padStart(32, '0')].reverse().fill(((event.target as HTMLInputElement).checked ? '1' : '0'), parseInt((event.target as HTMLElement).dataset.indexstart), parseInt((event.target as HTMLElement).dataset.indexend)).reverse().join(''));
}

function setCheckboxState(id: string, state: boolean[]): void {
    (document.getElementById(id) as HTMLInputElement).indeterminate = state[0];
    (document.getElementById(id) as HTMLInputElement).checked = state[1];
}

function updateCompositeCheckboxes(binState: string) {
    switch (parseInt(binState.slice(0, 5), 2)) { // Rarities
        case 31:
            setCheckboxState('filter-rarity', [false, true]);
            break;

        case 0:
            setCheckboxState('filter-rarity', [false, false]);
            break;

        default:
            setCheckboxState('filter-rarity', [true, true]);
            break;
    }

    switch (parseInt(binState.slice(5), 2)) { // Item Types
        case 134217727:
            setCheckboxState('filter-type', [false, true]);
            break;

        case 0:
            setCheckboxState('filter-type', [false, false]);
            break;

        default:
            setCheckboxState('filter-type', [true, true]);
            break;
    }

    switch (parseInt(binState.slice(5, 11), 2)) { // Armor
        case 63:
            setCheckboxState('filter-armor', [false, true]);
            break;

        case 0:
            setCheckboxState('filter-armor', [false, false]);
            break;

        default:
            setCheckboxState('filter-armor', [true, true]);
            break;
    }

    switch (parseInt(binState.slice(11, 27), 2)) { // Weapons
        case 65535:
            setCheckboxState('filter-weapons', [false, true]);
            break;

        case 0:
            setCheckboxState('filter-weapons', [false, false]);
            break;

        default:
            setCheckboxState('filter-weapons', [true, true]);
            break;
    }

    switch (parseInt(binState.slice(11, 18), 2)) { // Primary Weapons
        case 127:
            setCheckboxState('filter-primary', [false, true]);
            break;

        case 0:
            setCheckboxState('filter-primary', [false, false]);
            break;

        default:
            setCheckboxState('filter-primary', [true, true]);
            break;
    }

    switch (parseInt(binState.slice(18, 22), 2)) { // Secondary Weapons
        case 15:
            setCheckboxState('filter-secondary', [false, true]);
            break;

        case 0:
            setCheckboxState('filter-secondary', [false, false]);
            break;

        default:
            setCheckboxState('filter-secondary', [true, true]);
            break;
    }

    switch (parseInt(binState.slice(22, 27), 2)) { // Heavy Weapons
        case 31:
            setCheckboxState('filter-heavy', [false, true]);
            break;

        case 0:
            setCheckboxState('filter-heavy', [false, false]);
            break;

        default:
            setCheckboxState('filter-heavy', [true, true]);
            break;
    }

    switch (parseInt(binState.slice(28, 31), 2)) { // Equipment
        case 7:
            setCheckboxState('filter-equipment', [false, true]);
            break;

        case 0:
            setCheckboxState('filter-equipment', [false, false]);
            break;

        default:
            setCheckboxState('filter-equipment', [true, true]);
            break;
    }
}
