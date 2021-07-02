// import * as log from 'electron-log';

function searchVisibility(jqueryObj: JQuery) {
    return ((document.getElementById('search-box') as HTMLInputElement).value.toLowerCase() ? jqueryObj.attr('name')?.toLowerCase().includes((document.getElementById('search-box') as HTMLInputElement).value.toLowerCase()) : true);
}

function filterVisibility(jqueryObj: JQuery){
    if (jqueryObj.parents().attr('id') === 'extract-queue') {
        return true;
    } else {
        return [...document.getElementsByClassName('base-filter')].every((inputElem) => {
            return (jqueryObj.is((inputElem as HTMLElement).dataset.selector) ? (inputElem as HTMLInputElement).checked : true);
        });
    }
}

export function setVisibility(jqueryObj: JQuery) {
    let state = searchVisibility(jqueryObj) && filterVisibility(jqueryObj);
    jqueryObj.removeClass((state ? 'hidden' : 'm-1')).addClass((state ? 'm-1' : 'hidden'));
}

export function updateUIInput(elementId: string, value: any) {
    switch (typeof value) {
        case 'string':
            $(`#${elementId}`).val(value);
            break;

        case 'boolean':
            $(`#${elementId}`).prop('checked', !!value);
            break;

        default:
            break;
    }
}

export function uiConsolePrint(text: string) {
    document.getElementById('console-text').innerText += `${text}\n `;

    if ((document.getElementById("console-autoscroll-toggle") as HTMLInputElement).checked) {
        document.getElementById('console-container').scrollTop = document.getElementById('console-container').scrollHeight;
    }
}
