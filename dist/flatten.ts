export function flattenObject(obj: Record<string, any>, prefix: string = ''): Record<string, any> {
    let result: Record<string, any> = {};
    for (let key in obj) {
        if (!obj.hasOwnProperty(key)) continue;
        let newKey = prefix ? `${prefix}.${key}` : key;
        if (Array.isArray(obj[key])) {
            obj[key].forEach((val: any, index: any) => {
                result[`${newKey}[${index}]`] = val;
            });
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
            let nested = flattenObject(obj[key], newKey);
            for (let nestedKey in nested) {
                result[nestedKey] = nested[nestedKey];
            }
        } else {
            result[newKey] = obj[key];
        }
    }
    return result;
}

export function unflattenObject(flatObj: Record<string, any>): Record<string, any> {
    let result: Record<string, any> = {};
    for (let key in flatObj) {
        if (!flatObj.hasOwnProperty(key)) continue;
        let parts = key.split(/\.|\[|\]/).filter(Boolean);
        let current: Record<string, any> = result;
        for (let i = 0; i < parts.length; i++) {
            let part: string | number = isNaN(Number(parts[i])) ? parts[i] : Number(parts[i]);
            let nextPartIsArray = !isNaN(Number(parts[i + 1]));

            if (i === parts.length - 1) {
                current[part] = flatObj[key];
            } else {
                if (!(part in current)) {
                    current[part] = nextPartIsArray ? [] : {};
                }
                current = current[part];
            }
        }
    }
    return result;
}