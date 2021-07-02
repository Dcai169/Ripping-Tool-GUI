import * as path from 'path';
import { ipcRenderer } from 'electron';
import * as log from 'electron-log';
import { getReleaseAsset, toolVersion } from './loadingScripts.js';
import { userPreferences } from './../userPreferences.js';
import { GitHubAsset } from './../types/github';

setInterval(() => {
    let loadingDots = document.getElementById('loading-dots');
    if (loadingDots.innerText.length < 3) {
        loadingDots.innerText += '.';
    } else {
        loadingDots.innerText = '';
    }
}, 500);

function setBarPercent(percent: number, delay = 0) {
    setInterval(() => {
        document.getElementById('main-bar').style.width = `${percent}%`;
    }, delay);
}

async function checkToolIntegrity(): Promise<string> {
    log.info('Checking tool integrity');
    return new Promise(async (resolve, reject) => {
        if (userPreferences.get('toolPath')) {
            log.verbose(`Checking tool at ${userPreferences.get('toolPath')}`);
            let res = await toolVersion((userPreferences.get('toolPath') as string));
            if (!res.stderr) {
                resolve(res.stdout.substring(0, 5));
            } else {
                reject(res.stderr);
            }
        } else {
            log.verbose('Tool path undefined')
            reject(Error('Tool path undefined'));
        }
    });
}

async function updateTool(): Promise<GitHubAsset> {
    return new Promise(async (resolve, reject) => {
        let res = await toolVersion((userPreferences.get('toolPath') as string));
        if (!res.stderr) {
            let version = res.stdout.substring(0, 5);
            log.info(`Local Version: ${version}`);
            let latest = await getReleaseAsset();
            if (version === path.parse(latest.browser_download_url).dir.split('/').pop().substring(1)) {
                log.info('DCG is up to date');
            } else {
                log.info('DCG is not the most recent');
                log.info(`Newest version is ${path.parse(latest.browser_download_url).dir.split('/').pop().substring(1)}`);
            }
            resolve(latest);
        } else {
            reject(Error('Version check failed'));
        }
    });
}

let loadingTasks = [
    checkToolIntegrity()
];

setTimeout(() => {
    Promise.all(loadingTasks)
        .then((res) => {
            // Settle timeout
            setTimeout(() => {
                log.verbose('Loading done');
                ipcRenderer.send('loadingDone');
            }, 1000);
        })
        .catch((err) => {
            ipcRenderer.send('mainPrint', err);
        });
}, 2000);


// document.getElementById('launch-button').addEventListener('click', () => { ipcRenderer.send('loadingDone'); });