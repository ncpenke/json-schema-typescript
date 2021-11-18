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
            if ("enum_values" in def) {
                ret.push(this.generateNamedEnum(def.enum_values, name))
            }
            else if ("object_properties" in def) {
                ret.push(this.generateNamedInterface(def.object_properties, name));
            }
        }

        return ret.join("");
    }

    private generateInlineType(type: TypescriptType, indent:string): string 
    {
        let array = "";
        if ("array" in type && type.array) {
            array = "[]";
        }
        if ("enum_values" in type) {
            return `${this.generateInlineEnum(type.enum_values)}${array}`;
        }
        else if ("object_properties" in type) {
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
            ret += `${indent}${propName}${optional}: ${this.generateInlineType(propDef.type, indent)};\n`
        }
        return ret;
    }
}
