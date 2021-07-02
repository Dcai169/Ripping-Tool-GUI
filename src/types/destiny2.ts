export interface Destiny2Item {
    [key: string]: any,
    displayProperties: {
        description: string,
        name: string,
        icon: string,
        hasIcon: boolean
    },
    inventory: {
        maxStackSize: number,
        bucketTypeHash: number,
        recoveryBucketTypeHash: number,
        tierTypeHash: number,
        isInstanceItem: boolean,
        nonTransferrableOriginal: boolean,
        tierTypeName: string,
        tierType: number,
        expirationTooltip: string,
        expiredInActivityMessage: string,
        expiredInOrbitMessage: string,
        suppressExpirationWhenObjectivesComplete: boolean
    },
    defaultDamageType: number,
    itemType: number,
    itemSubType: number,
    hash: number,
    index: number,
}