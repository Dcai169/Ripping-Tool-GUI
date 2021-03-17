const path = require('path');
const fs = require('fs');
const { ipcRenderer } = require('electron');
const { api, is } = require('electron-util');
const { downloadAndExtractTool, getReleaseAsset } = require('./scripts/githubReleaseDler.js');

const { toolVersion } = require('./scripts/toolChecker.js');
const { userPreferences } = require('../userPreferences');

let toolDownloadedFlag = false;
let toolStatus;

ipcRenderer.send('mainPrint', 'Initialization');

setInterval(() => {
    let loadingDots = document.getElementById('loading-dots');
    if (loadingDots.innerText.length < 3) {
        loadingDots.innerText += '.';
    } else {
        loadingDots.innerText = '';
    }
}, 500);

function parsePercent(widthPercent) {
    return parseInt(widthPercent.slice(0, -1).trim());
}

function redownloadTool() {
    ipcRenderer.send('mainPrint', 'Redownload initated');
    return new Promise((resolve, reject) => {
        try {
            fs.rmdirSync(path.parse(userPreferences.get('toolPath')).dir, { recursive: true });
            fs.mkdirSync(path.parse(userPreferences.get('toolPath')).dir, { recursive: true });
            downloadAndExtractTool(path.parse(userPreferences.get('toolPath')).dir)
                .then(resolve)
                .catch(reject); // No internet or no r/w permission
        } catch (err) {
            reject(err); // No r/w permission
        }
    });
}

function setUiState({ stateString, mainPercent, subPercent }) {
    return new Promise((resolve, reject) => {
        try {
            let mainBar = document.getElementById('main-bar');
            // let subBar = document.getElementById('sub-bar');

            if (stateString) {
                document.getElementById('loading-summary').innerText = stateString;
            }
            if (mainPercent) {
                mainBar.style.width = `${parsePercent(mainBar.style.width) + mainPercent}%`;
            } else if (typeof mainPercent === 'number') {
                mainBar.style.width = '0%';
            }

            // if (subPercent) {
            //     subBar.style.width = `${parsePercent(subBar.style.width) + subPercent}%`;
            // } else if (typeof subPercent === 'number') {
            //     subBar.style.width = '0%';
            // }

            setTimeout(() => { resolve(stateString) }, 500);
        } catch (err) {
            reject(err); // If this is called something has really gone wrong.
        }
    });

}

function checkToolIntegrity() {
    ipcRenderer.send('mainPrint', 'Checking Tool Integrity');
    return new Promise((resolve, reject) => {
        ipcRenderer.send('mainPrint', 'Checking Tool');
        toolVersion(userPreferences.get('toolPath'))
            .then((version) => {
                ipcRenderer.send('mainPrint', `Local Version: ${version.substring(0, 5)}`);
                ipcRenderer.send('mainPrint', version);
                getReleaseAsset()
                    .then((res) => {
                        if (userPreferences.get('autoUpdateTool')) {
                            // check for updates
                            if (version.substring(0, 5) === path.parse(res.browser_download_url).dir.split('/').pop().substring(1)) {
                                ipcRenderer.send('mainPrint', 'DCG is up to date');
                                resolve(version);
                            } else {
                                ipcRenderer.send('mainPrint', 'DCG is not the most recent');
                                ipcRenderer.send('mainPrint', `Newest version is ${path.parse(res.browser_download_url).dir.split('/').pop().substring(1)}`);
                                redownloadTool()
                                    .then(resolve)
                                    .catch(reject);
                            }
                        } else {
                            resolve(version)
                        }
                    })
                    .catch(reject);
            })
            .catch(() => { // Will be called if tool is broken
                ipcRenderer.send('mainPrint', 'Tool version unknown');
                // Try to redownload
                redownloadTool()
                    .then(resolve)
                    .catch(reject);
            });
        if (!typeof toolStatus === Array) {
            reject('Unable to determine tool version.'); // Will be called if tool is between version 1.5.1 and 1.6.2
        } else {
            resolve();
        }
    });
}

let loadingTasks = [
    // loadUserPreferences(),
    // checkToolIntegrity(),
    // setUiState({ stateString: 'Done', mainPercent: 50, subPercent: 0 })
];

Promise.all(loadingTasks)
    .then((res) => {
        // Settle timeout
        setTimeout(() => {
            // ipcRenderer.send('loadingDone');
        }, 1000);
    })
    .catch((err) => {
        ipcRenderer.send('mainPrint', err);
    });

document.getElementById('launch-button').addEventListener('click', () => { ipcRenderer.send('loadingDone'); });