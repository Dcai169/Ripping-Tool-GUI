import * as axios from 'axios';
import { Destiny1Item } from './../../types/destiny1';
import { Destiny2Item } from './../../types/destiny2';

// Read API Key
require('dotenv').config({ path: 'api.env' });

const baseUrl = 'https://bungie.net';
const blacklistedDestiny1Hashes = [4248210736]; // Default Shader
const blacklistedDestiny2Hashes = [4248210736, 2426387438, 2931483505, 1959648454, 702981643, 2325217837, 2965439266, 4236468733, 2699000684, 1702504372, 3344732822, 2912265353, 4143534670, 873770815, 3367964921, 4089988225, 811724212, 3054638345, 463166592, 3507818312, 3835954362, 1339405989, 3807544519, 834178986, 839740147, 577345565, 574694085, 2039333456, 60802325, 3031612900, 2449203932, 242730894, 3735037521, 558870048, 2419910641, 2552954151, 2251060291, 3692806198];

export function getDestiny1ItemDefinitions(locale = 'en'): Promise<Map<number, Destiny1Item>> {
    return new Promise((resolve, reject) => {
        let destiny1ItemDefinitions: Destiny1Item[] = [];
        // Send GET request to manifest server
        axios.default.get(`https://dare-manifest-server.herokuapp.com/manifest?locale=${locale}`)
            .then((res) => {
                for (const item of Object.values(res.data)) {
                    // Filter items in the manifest
                    if (((item: Destiny1Item) => {
                        if (blacklistedDestiny1Hashes.includes(item.hash)) { return false; }
                        if (arrayEquals(item.itemCategoryHashes, [23, 38, 20])) { return false; } // Hunter Artifacts
                        if (arrayEquals(item.itemCategoryHashes, [22, 38, 20])) { return false; } // Titan Artifacts
                        if (arrayEquals(item.itemCategoryHashes, [21, 38, 20])) { return false; } // Warlock Artifacts
                        if (item.itemCategoryHashes && item.itemCategoryHashes.includes(1) && item.itemCategoryHashes.length === 2) { return false; } // Reforge Weapon
                        if (arrayEquals(item.itemCategoryHashes, [41, 52])) { return true; } // Shaders
                        if (arrayEquals(item.itemCategoryHashes, [42, 52])) { return true; } // Ships
                        if ([2, 3].includes(item.itemType)) { return true; } // Armor and Weapons
                        return false;
                    })((item as Destiny1Item))) {
                        destiny1ItemDefinitions.push((item as Destiny1Item));
                    }
                }
                // Sort into a Map Object
                let items = Object.values(destiny1ItemDefinitions).sort((a: Destiny1Item, b: Destiny1Item) => { return a.index - b.index });
                let destiny1ItemMap = new Map<number, any>();
                items.forEach((item: Destiny1Item) => {
                    destiny1ItemMap.set(item.hash, item);
                });
                resolve(destiny1ItemMap);
            }).catch(reject);
    });
}

export function getDestiny2ItemDefinitions(locale = 'en'): Promise<Map<number, Destiny2Item>> {
    return new Promise((resolve, reject) => {
        let destiny2ItemDefinitions: Destiny2Item[] = [];
        // Send GET request to manifest server
        axios.default.get(baseUrl + '/Platform/Destiny2/Manifest/', { headers: { 'X-API-Key': process.env.API_KEY } })
            .then((res) => {
                // Send GET for item definitions
                axios.default.get(baseUrl + res.data.Response.jsonWorldComponentContentPaths[locale].DestinyInventoryItemDefinition)
                    .then((res) => {
                        for (let item of Object.values(res.data)) {
                            if (((item: Destiny2Item) => {
                                if (blacklistedDestiny2Hashes.includes(item.hash)) { return false }
                                if ([2, 21, 22, 24].includes(item.itemType)) { return true } // Armor, Ships, Sparrows, Ghost Shells
                                if (item.defaultDamageType > 0) { return true } // Weapons
                                if (item.itemType === 19 && [20, 21].includes(item.itemSubType)) { return true } // Ornaments
                                return false;
                            })((item as Destiny2Item))) {
                                destiny2ItemDefinitions.push((item as Destiny2Item));
                            }
                        }
                        // Sort into a Map object
                        let items = Object.values(destiny2ItemDefinitions).sort((a: Destiny2Item, b: Destiny2Item) => { return a.index - b.index });
                        let destiny2ItemMap = new Map();
                        items.forEach((item: Destiny2Item) => {
                            destiny2ItemMap.set(item.hash, item);
                        });
                        resolve(destiny2ItemMap);
                    }).catch(reject);
            }).catch(reject);
    });
}

function arrayEquals(a: any[], b: any[]): boolean {
    return Array.isArray(a) && Array.isArray(b) && // both are Arrays
        a.length === b.length && // Same length
        a.every((val, index) => val === b[index]); // each value is the same
}
