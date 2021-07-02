import { api } from 'electron-util';
import * as log from 'electron-log';
import * as Store from 'electron-store';
import * as fs from 'fs';
import * as path from 'path';
import { getReleaseAsset, findExecutable } from './loading/loadingScripts.js';
import { ipcRenderer } from 'electron';

import { GitHubAsset } from './types/github';

export function logError(err: any): void {
    console.error(err);
    log.error(err);
}

function defaultOutputPath(): string {
    let defaultPath = path.join(api.app.getPath('documents'), 'DARE Output');
    try {
        fs.mkdirSync(defaultPath);
    } catch (err) {
        if (err.code === "EEXIST") {
            return defaultPath;
        } else {
            logError(err);
            return '';
            // throw err;
        }
    }
    return '';
}

function defaultToolPath(): string {
    let toolDirectory = path.join(api.app.getPath('userData'), 'bin');
    try {
        fs.mkdirSync(toolDirectory);
    } catch (err) {
        if (err.code === "EEXIST") {
            if (findExecutable(toolDirectory).name) {
                return path.join(toolDirectory, findExecutable(toolDirectory).name);
            }
        } else {
            logError(err);
            return '';
        }
    }

    getReleaseAsset()
        .then((res: GitHubAsset) => {
            if (ipcRenderer) {
                log.verbose(`Downloading ${res.browser_download_url} to ${toolDirectory}`);
                ipcRenderer.send('dlStart', { url: res.browser_download_url, dlPath: toolDirectory });
                ipcRenderer.once('dlFinish', (_, args) => {
                    return args;
                });
            }
        }).catch((err) => {
            logError(err);
            return '';
        });
    return '';
}

export const userPreferences = new Store({
    schema: {
        "outputPath": {
            type: 'string',
            default: defaultOutputPath(),
        },
        "toolPath": {
            type: 'string',
            default: defaultToolPath()
        },
        "locale": {
            type: 'string',
            enum: ['de', 'en', 'es', 'es-mx', 'fr', 'it', 'ja', 'ko', 'pl', 'pt-br', 'ru', 'zh-cht', 'zh-chs'],
            default: 'en'
        },
        "aggregateOutput": {
            type: 'boolean',
            default: true
        }
    },
});
