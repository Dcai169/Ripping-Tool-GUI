import { execFile } from 'child_process';
import * as log from 'electron-log';
import { toolVersion } from '../../loading/loadingScripts.js';
import { userPreferences } from './../../userPreferences.js';
import { uiConsolePrint } from './uiUtils.js';

let gameSelector = document.getElementById('gameSelector') as HTMLInputElement;
let queue = $('#extract-queue');

function hideLoading() {
    $('#loading-indicator').removeClass('p-1').addClass('hidden');
    $('#queue-execute-button').removeAttr('disabled');
}

function updateUiDone(code: number) {
    hideLoading();
    uiConsolePrint(`Done (Exit Code: ${code})`);
}

function runTool(game: string, hashes: string[]) {
    // DestinyColladaGenerator.exe [<GAME>] [-o <OUTPUTPATH>] [<HASHES>]
    let commandArgs = [game, '-o', (userPreferences.get('outputPath') as string)].concat(hashes);
    let child = execFile((userPreferences.get('toolPath') as string), commandArgs, (err: Error) => {
        if (err) {
            throw err;
        }
    });
    child.stdout.on('data', uiConsolePrint);
    child.stderr.on('data', uiConsolePrint);

    return child;
}

function runToolRecursive(game: string, itemHashes: string[]) {
    if (itemHashes.length > 0) {
        let child = runTool(game, [itemHashes.pop()]);
        child.on('exit', (code) => { runToolRecursive(game, itemHashes) });
    }
}

function execute(game: string, hashes: string[]) {
    log.info(`Hashes: ${hashes.join(' ')}`);
    // change DOM to reflect program state
    $('#loading-indicator').removeClass('hidden').addClass('p-1');
    $('#queue-execute-button').attr('disabled', 'disabled');

    if (userPreferences.get('aggregateOutput')) {
        runTool(game, hashes).on('exit', (code) => {
            log.info(`Done (Exit Code: ${code})`)
            updateUiDone(code);
        });
    } else {
        runToolRecursive(game, hashes);
        hideLoading();
    }
}

export function executeButtonClickHandler() {
    toolVersion((userPreferences.get('toolPath') as string))
        .then((res) => {
            if (res.stdout) {
                uiConsolePrint(`DCG v${res.stdout.substring(0, 5)}`);
                if (navigator.onLine) {
                    let itemHashes = [...queue.eq(0).children()].map(item => { return item.id });
                    uiConsolePrint(`Hashes: ${itemHashes.join(' ')}`);
            
                    execute(gameSelector.value, itemHashes);
                } else {
                    uiConsolePrint('No internet connection detected.');
                    hideLoading();
                }
            } else if (res.stderr) {
                uiConsolePrint('DCG version could not be determined.');
                uiConsolePrint(`Error: ${res.stderr}`);
                hideLoading();
            }
        })
        .catch(() => {
            uiConsolePrint('DCG inoperable.');
            hideLoading();
        });
}
