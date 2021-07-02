export interface Destiny1Item {
    itemHash: number;
    itemName: string;
    itemDescription: string;
    icon: string;
    hasIcon: boolean;
    secondaryIcon: string;
    actionName: string;
    hasAction: boolean;
    deleteOnAction: boolean;
    tierTypeName: string;
    tierType: number;
    itemTypeName: string;
    bucketTypeHash: number;
    primaryBaseStatHash: number;
    stats: { [key: string]: Stat };
    perkHashes: any[];
    specialItemType: number;
    talentGridHash: number;
    equippingBlock: EquippingBlock;
    hasGeometry: boolean;
    statGroupHash: number;
    itemLevels: number[];
    qualityLevel: number;
    equippable: boolean;
    instanced: boolean;
    rewardItemHash: number;
    values: Values;
    itemType: number;
    itemSubType: number;
    classType: number;
    itemCategoryHashes: number[];
    sourceHashes: any[];
    nonTransferrable: boolean;
    exclusive: number;
    maxStackSize: number;
    itemIndex: number;
    setItemHashes: any[];
    tooltipStyle: string;
    questlineItemHash: number;
    needsFullCompletion: boolean;
    objectiveHashes: any[];
    allowActions: boolean;
    questTrackingUnlockValueHash: number;
    bountyResetUnlockHash: number;
    uniquenessHash: number;
    showActiveNodesInTooltip: boolean;
    hash: number;
    index: number;
    redacted: boolean;
}

export interface EquippingBlock {
    weaponSandboxPatternIndex: number;
    gearArtArrangementIndex: number;
    defaultDyes: DefaultDye[];
    lockedDyes: any[];
    customDyes: any[];
    customDyeExpression: CustomDyeExpression;
    weaponPatternHash: number;
    arrangements: Arrangement[];
    equipmentSlotHash: number;
}

export interface Arrangement {
    classHash: number;
    gearArtArrangementIndex: number;
}

export interface CustomDyeExpression {
    steps: Step[];
}

export interface Step {
    stepOperator: number;
    flagHash: number;
    valueHash: number;
    value: number;
}

export interface DefaultDye {
    channelHash: number;
    dyeHash: number;
}

export interface Stat {
    statHash: number;
    value: number;
    minimum: number;
    maximum: number;
}

export interface Values {
}