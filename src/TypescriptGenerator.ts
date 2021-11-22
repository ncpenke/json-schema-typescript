import { TypescriptNamedTypeMap, TypeScriptObjectPropertyMap, TypescriptType } from "./TypescriptDefinitions";

export class TypescriptGenerator
{
    _indent: string;

    public constructor(indent: string)
    {
        this._indent = indent;
    }

    public generateTypes(types: TypescriptNamedTypeMap): string {
        let ret:string[] = [];

        for(let name in types) {
            let def = types[name];
            if ("array" in def && def.array) {
                ret.push(this.generateNamedArray(def, name));
            }
            else if ("enum_values" in def && def.enum_values != undefined) {
                ret.push(this.generateNamedEnum(def.enum_values, name))
            }
            else if ("object_properties" in def && def.object_properties != undefined) {
                ret.push(this.generateNamedInterface(def.object_properties, name));
            }
            else {
                throw `Unimplemented type ${name}`;
            }
        }

        return ret.join("");
    }

    private generateNamedArray(type: TypescriptType, name: string): string {
        return `export type ${name} = ${this.generateInlineType(type, "")};\n`;
    }

    private generateInlineType(type: TypescriptType, indent:string): string 
    {
        let array = "";
        if ("array" in type && type.array) {
            array = "[]";
        }
        if ("enum_values" in type && type.enum_values != undefined) {
            return `${this.generateInlineEnum(type.enum_values)}${array}`;
        }
        else if ("object_properties" in type && type.object_properties != undefined) {
            return `${this.generateInlineInterface(type.object_properties, indent)}${array}`;
        }
        else {
            return `${type.type}${array}`;
        }
    }

    private generateInlineEnum(values: string[]) {
        return `(${values.join("|")})`;
    }

    private generateNamedEnum(values: string[], name: string) {
        values = values.map(v => `${this._indent}${v.toUpperCase()}=\"${v}\"`);
        return `export enum ${name} {\n${values.join(",\n")}\n}\n`;
    }

    private generateNamedInterface(objectProperties: TypeScriptObjectPropertyMap, name: string)
    {
        return `export interface ${name} {\n${this.generateInterfaceBody(objectProperties, this._indent)}}\n`;
    }

    private generateInlineInterface(objectProperties: TypeScriptObjectPropertyMap, indent: string) 
    {
        return `{\n${this.generateInterfaceBody(objectProperties,indent + this._indent)}${indent}}`;
    }

    private generateInterfaceBody(objectProperties: TypeScriptObjectPropertyMap, indent: string)
    {
        let ret = "";
        for (let propName in objectProperties) {
            let propDef = objectProperties[propName];
            let optional = "?";
            if ("required" in propDef || propDef.required) {
                optional = "";
            }
            try {
                ret += `${indent}${propName}${optional}: ${this.generateInlineType(propDef.type, indent)};\n`
            }
            catch(e) {
                throw `Error processing ${propName} ${e};`
            }
        }
        return ret;
    }
}
