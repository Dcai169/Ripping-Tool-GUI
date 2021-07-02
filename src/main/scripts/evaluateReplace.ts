export function evaluateReplace(expression: any, replacement: any, callback = (res: any) => { return res; }, evalTarget = false) {
    return (!!expression === evalTarget ? replacement : callback(expression));
}