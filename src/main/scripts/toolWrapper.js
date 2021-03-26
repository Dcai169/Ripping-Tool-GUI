const { execFile } = require('child_process');
const log = require('electron-log');
const { userPreferences } = require('./../../userPreferences.js');

function updateUiDone(code) {
    $('#loading-indicator').removeClass('p-1').addClass('hidden');
    $('#queue-execute-button').removeAttr('disabled');
    uiConsolePrint(`Done (Exit Code: ${code})`);
}

function runTool(game, hashes) {
    // DestinyColladaGenerator.exe [<GAME>] [-o <OUTPUTPATH>] [<HASHES>]
    let commandArgs = [game, '-o', userPreferences.get('outputPath')].concat(hashes);
    let child = execFile(userPreferences.get('toolPath'), commandArgs, (err) => {
        if (err) {
            throw err;
        }
    });
    child.stdout.on('data', uiConsolePrint);
    child.stderr.on('data', uiConsolePrint);

    return child;
}

function runToolRecursive(game, itemHashes) {
    if (itemHashes.length > 0) {
        let child = runTool(game, [itemHashes.pop()]);
        child.on('exit', (code) => { runToolRecursive(game, itemHashes) });
    }
}

function execute(game, hashes) {
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
        $('#loading-indicator').removeClass('p-1').addClass('hidden');
        $('#queue-execute-button').removeAttr('disabled');
    }
}

function executeButtonClickHandler() {
    if (navigator.onLine) {
        let itemHashes = [...queue.eq(0).children()].map(item => { return item.id });
        uiConsolePrint(`Hashes: ${itemHashes.join(' ')}`);

        execute(gameSelector.value, itemHashes);
    } else {
        uiConsolePrint('No internet connection detected');
    }
}

function uiConsolePrint(text) {
    document.getElementById('console-text').innerText += `${text}\n `;

    if (document.getElementById("console-autoscroll-toggle").checked) {
        document.getElementById('console-container').scrollTop = document.getElementById('console-container').scrollHeight;
    }
}

module.exports = { executeButtonClickHandler };