export interface DefaultObject
{
    [key:string]: DefaultObject|string|string[]|DefaultObject[];
}

function stringifyArray(arr: string[]|DefaultObject[], currentIndent: string, indentIncrement:string): string
{
    let nextIndent = currentIndent + indentIncrement;
    return [
        '[\n',
        arr.map(v => {
            if (typeof v == 'string') {
                return `${nextIndent}${v}`;
            }
            else {
                return `${nextIndent}${stringifyDefaultObject(v, currentIndent + indentIncrement, indentIncrement)}`;
            }
        }).join(",\n"),
        `\n${currentIndent}]`
    ].join("");
}

export function stringifyDefaultObject(obj: DefaultObject, currentIndent:string, indentIncrement:string): string
{
    let props:string[] = [];
    let nextIndent = currentIndent + indentIncrement;
    for(let k in obj) {
        let val = obj[k];
        if (Array.isArray(val)) {
            props.push(`${nextIndent}${k}: ${stringifyArray(val as (string[]|DefaultObject[]), nextIndent, indentIncrement)}`);
        }
        else if (typeof val == 'string') {
            props.push(`${nextIndent}${k}: ${val}`);
        }
        else {
            props.push(`${nextIndent}${k}: ${stringifyDefaultObject(val as DefaultObject, nextIndent, indentIncrement)}`);
        }
    }
    return [
        '{\n',
        props.join(",\n"),
        `\n${currentIndent}}`
    ].join("");
}
