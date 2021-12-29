import * as path from 'path';
import { DefaultObject, stringifyDefaultObject } from './DefaultObject';

/**
 * Structure of the JSON schema fields that are used
 */
export interface JsonSchemaDefinition
{
    "type"?: string;
    "enum"?: string[];
    "$ref"?: string;
    "format"?: string;
    "items"?: JsonSchemaDefinition
    "required"?: string[];
    "properties"?: {[key:string]:JsonSchemaDefinition};
    "default"?: any;
    "minimum"?: number;
    "maximum"?: number;
}

/**
 * Structure of the JSON root schema definition
 */
export interface JsonSchemaRootDefinition extends JsonSchemaDefinition
{
    "$defs"?: {[key:string]:JsonSchemaDefinition};
}

/**
 * Properties of an object used for generation
 */
export type TypescriptGeneratorTypeInfoObjectPropertyMap = 
{
    [name:string]: 
    {
        required?: boolean,
        typeInfo: TypescriptGeneratorTypeInfo
    }
};

/**
 * Intermediate representation to facilitate generation 
 */
export interface TypescriptGeneratorTypeInfo
{
    array?: TypescriptGeneratorTypeInfo;
    objectProperties?: TypescriptGeneratorTypeInfoObjectPropertyMap;
    enumValues?: string[];
    type?: string;
    typeRef?: string;
}

export type TypescriptGeneratorNamedTypeMap = {[key:string]: TypescriptGeneratorTypeInfo}

/**
 * Helper representation to allow the generator to generate type information. The TypescriptGeneratorTypeInfo 
 * representation is converted to this before it's stringified.
 */
export interface TypescriptJsonDeserializerTypeInfoInternal
{
    array?: string | TypescriptJsonDeserializerTypeInfoInternal;
    objectProperties?: {[name:string]: 
        {
            required?: string,
            typeInfo: string | TypescriptJsonDeserializerTypeInfoInternal;
        }
    };
    enumValues?: string[];
    type?: string;
}

export class TypescriptGenerator
{
    private _indent: string;
    private _externalRefs: string[];
    private _schema: JsonSchemaRootDefinition;
    private _schemaName: string;
    private _dependencyOrder: string[];

    public constructor(schema: JsonSchemaRootDefinition, schemaName: string, indent: string)
    {
        this._indent = indent;
        this._externalRefs = TypescriptGenerator.externalRefs(schema);
        this._schema = schema;
        this._schemaName = schemaName;
        this._dependencyOrder =  this.determineDependencyOrder();
    }

    private static externalRefs(schema: JsonSchemaRootDefinition): string[]
    {
        let ret = [
            ...this.externalRefsHelper(schema)
        ];
        for (let k in schema.$defs) {
            ret.push(...this.externalRefsHelper(schema.$defs[k]));
        }
        return this.removeDuplicates(ret);
    }

    private static externalRefsHelper(schema: JsonSchemaDefinition): string[]
    {
        if (schema?.$ref != undefined) {
            if (TypescriptGenerator.isExternalRef(schema.$ref)) {
                return [ schema.$ref ];
            }
            else {
                return [];
            }
        }
        else if(schema?.items != undefined) {
            return this.externalRefs(schema.items);
        }
        else if (schema?.properties != undefined) {
            let ret: string[] = [];
            for (let k in schema.properties) {
                let prop = schema.properties[k];
                ret.push(...this.externalRefs(schema.properties[k]));
            }
            return ret;
        }
        else {
            return [];
        }
    }

    /**
     * @param ref The JSON schema reference
     * @returns The unresolved type name of the reference
     */
    private static unresolvedRefType(ref: string)
    {
        if (TypescriptGenerator.isExternalRef(ref)) {
            return path.basename(ref, path.extname(ref));
        }
        else {
            let refPath = ref.split("/");
            return refPath[refPath.length - 1];
        }
    }
    
    private static isExternalRef(ref: string)
    {
        return ref.length > 0 && ref[0] != "#";
    }    

    /**
     * 
     * @param ref The JSON schema reference
     * @returns THe resolved type name of the reference. This is the same as the unresolved
     * type name for internal references, and the fully resolved type name for external
     * references.
     */
    private static resolvedRefType(ref: string)
    {
        let name = TypescriptGenerator.unresolvedRefType(ref);
        if (TypescriptGenerator.isExternalRef(ref)) {
            return `_${name}.${name}`;
        }
        else {
            return name;
        }
    }

    public static toGeneratorTypeInfo(def: JsonSchemaDefinition, rootDef: JsonSchemaRootDefinition): TypescriptGeneratorTypeInfo
    {
        let type = def?.type ?? "";
        if (type == "array") {
            if (def.items == undefined) {
                throw new Error(`Items missing in array ${JSON.stringify(def)}`);
            }
            return {
                array: this.toGeneratorTypeInfo(def.items, rootDef)
            };
        }
        else if (type == "string") {
            if (def?.enum != undefined) {
                return {
                    enumValues: [...def.enum]
                };
            }
            else if (def?.format == "date") {
                return {
                    type: "Date"
                }
            }
            return {
                type: type
            };
        }
        else if (type == "object") {            
            if (def?.properties == undefined) {
                throw new Error(`Object missing properties ${JSON.stringify(def)}`);
            }

            let ret: TypescriptGeneratorTypeInfo = {
                objectProperties: {}
            };
            let objProps = ret.objectProperties;
            let required = def?.required ?? [];

            for (let k in def.properties) {
                let isRequired = required.indexOf(k) >= 0;
                objProps![k] = {
                    typeInfo: this.toGeneratorTypeInfo(def.properties[k], rootDef)
                };
                if (isRequired) {
                    objProps![k].required = isRequired;
                }
            }
            return ret;
        }
        else if (type.length > 0) {
            return {
                type: type
            };
        }
        else if (def?.$ref) {
            let ref = def.$ref;
            if (!TypescriptGenerator.isExternalRef(ref)) {
                if (rootDef.$defs == undefined || (!(this.resolvedRefType(ref) in rootDef.$defs))) {
                    throw new Error(`Internal ref ${ref} not found in $defs`);
                }
            }
            return {
                typeRef: ref
            }
        }
        else {
            throw new Error(`Unexpected definition ${JSON.stringify(def)}`);
        }
    }

    public generate(): string
    {
        let namedTypeMap: TypescriptGeneratorNamedTypeMap = {};
        let rootType = {
            ...this._schema
        };
        if (rootType?.$defs != undefined) {
            delete rootType["$defs"];
        }
        namedTypeMap[this._schemaName] = TypescriptGenerator.toGeneratorTypeInfo(rootType, this._schema);
        if (this._schema?.$defs != undefined) {
            for (let ref in this._schema.$defs) {
                namedTypeMap[ref] = TypescriptGenerator.toGeneratorTypeInfo(this._schema.$defs[ref], this._schema);
            }
        }

        return [
            ...this.generateImports(),
            ...this.generateNamedTypes(namedTypeMap),
            ...TypescriptGenerator.generateNamedTypeInfo(namedTypeMap, this._dependencyOrder, this._indent)
        ].join("");
    }

    public generateImports(): string[]
    {
        let ret = Array.from(this._externalRefs.values()).map(s => {
            return `import * as _${TypescriptGenerator.unresolvedRefType(s)} from "${s.replace(path.extname(s), "")}";\n`
        });
        ret.push("import { TypescriptJsonDeserializerTypeInfo } from 'json-schema-typescript';\n")
        return ret;
    }

    private static quotedString(str: string)
    {
        return `"${str}"`;
    }

    public static internalGeneratorTypeInfo(type: TypescriptGeneratorTypeInfo): TypescriptJsonDeserializerTypeInfoInternal | string
    {
        let ret: TypescriptJsonDeserializerTypeInfoInternal = {};
        if (type?.typeRef) {
            return `${this.resolvedRefType(type.typeRef)}TypeInfo`;
        }
        else if (type?.array != undefined) {
            ret.array = this.internalGeneratorTypeInfo(type.array);
        }
        else if (type?.type != undefined) {
            ret.type = this.quotedString(type.type);
        }
        else if (type?.objectProperties != undefined) {
            ret.objectProperties = {};
            for (let k in type.objectProperties) {
                let prop = type.objectProperties[k];
                ret.objectProperties[k] = {
                    typeInfo: this.internalGeneratorTypeInfo(prop.typeInfo)
                }
                if (prop?.required ?? false) {
                    ret.objectProperties[k].required = "true";
                }
            }
        }
        else if (type?.enumValues != undefined) {
            ret.enumValues = type.enumValues?.map(v => this.quotedString(v)) ?? undefined;
        }
        else {
            throw new Error(`Unknown type info ${JSON.stringify(type)}`);
        }
        return ret;
    }

    private static getDirectDependencies(def: JsonSchemaDefinition): string[]
    {
        if (def?.$ref != undefined) {
            if (!TypescriptGenerator.isExternalRef(def.$ref)) {
                return [ TypescriptGenerator.resolvedRefType(def.$ref) ];
            }
            else {
                return [];
            }
        }
        else if (def?.items != undefined) {
            return this.getDirectDependencies(def.items);
        }
        else if (def?.properties != undefined) {
            let ret = []
            for (let k in def.properties) {
                ret.push(...this.getDirectDependencies(def.properties[k]));
            }
            return ret;
        }
        else {
            return [];
        }
    }

    private static removeDuplicates(arr: string[]): string[]
    {
        return Array.from((new Set<string>(arr)).values());
    }

    private static addDependencies(depends: {[key:string]: string[]}, visited: Set<string>, current: string, order: string[])
    {
        if (visited.has(current)) {
            throw new Error(`Circular dependency detected for ${current}`);
        }
        visited.add(current);
        if (current in depends) {
            let arr = depends[current];
            arr.forEach(e => {
                // not added to order yet
                if (order.indexOf(e) < 0) {
                    this.addDependencies(depends, visited, e, order);
                    if (order.indexOf(e) < 0) {
                        throw new Error(`Error traversing dependency ${e} for ${current}`);
                    }
                }
            });
        }
        order.push(current);
    }

    public determineDependencyOrder(): string[]
    {
        let depends:{[key:string]: string[]} = {};

        depends[this._schemaName] = TypescriptGenerator.removeDuplicates(TypescriptGenerator.getDirectDependencies(this._schema));

        if (this._schema?.$defs != undefined) {
            for (let k in this._schema.$defs) {
                depends[k] = TypescriptGenerator.removeDuplicates(TypescriptGenerator.getDirectDependencies(this._schema.$defs[k]));
            }
        }

        let ret: string[] = [];
        let visited: Set<string> = new Set<string>();
        for (let k in depends) {
            if (ret.indexOf(k) < 0) {
                TypescriptGenerator.addDependencies(depends, visited, k, ret);
            }
        }
        return ret;
    }

    public static generateNamedTypeInfo(namedTypeMap: TypescriptGeneratorNamedTypeMap, order: string[], indent: string): string[]
    {
        let ret: string[] = [];
        order.forEach(k => {
            let type = namedTypeMap[k];
            ret.push(`export let ${k}TypeInfo: TypescriptJsonDeserializerTypeInfo = ${stringifyDefaultObject(TypescriptGenerator.internalGeneratorTypeInfo(type) as DefaultObject, "", indent)};\n`);
        });
        return ret;
    }

    public generateNamedTypes(namedTypeMap: TypescriptGeneratorNamedTypeMap): string[]
    {
        let ret = []
        for (let ref in namedTypeMap) {
            ret.push(this.generateNamedType(namedTypeMap[ref], ref));
        }

        return ret;
    }

    private generateNamedType(type: TypescriptGeneratorTypeInfo, name: string): string
    {
        if (type?.array != undefined) {
            return this.generateNamedArray(type.array, name);
        }
        else if (type?.enumValues != undefined) {
            return this.generateNamedEnum(type.enumValues, name);
        }
        else if (type?.objectProperties != undefined) {
            return this.generateNamedInterface(type.objectProperties, name);
        }
        else if (type?.type != undefined) {
            return `export type ${name} = ${type};\n`
        }
        else {
            throw `Unexpected type ${name}`;
        }
    }

    private generateNamedArray(type: TypescriptGeneratorTypeInfo, name: string): string {
        return `export type ${name} = ${this.generateInlineType(type, "")}[];\n`;
    }

    private generateInlineType(typeInfo: TypescriptGeneratorTypeInfo, indent:string): string 
    {
        if (typeInfo?.array != undefined) {
            return `${this.generateInlineType(typeInfo.array, indent)}[]`;
        }
        else if (typeInfo?.enumValues != undefined) {
            return `${this.generateInlineEnum(typeInfo.enumValues)}`;
        }
        else if (typeInfo?.objectProperties != undefined) {
            return `${this.generateInlineInterface(typeInfo.objectProperties, indent)}`;
        }
        else if (typeInfo?.typeRef != undefined) {
            return TypescriptGenerator.resolvedRefType(typeInfo.typeRef);
        }
        else if (typeInfo?.type != undefined) {
            return typeInfo.type;
        }
        else {
            throw new Error(`Unexpected type ${JSON.stringify(typeInfo)}`);
        }
    }

    private generateInlineEnum(values: string[]) {
        return `(${values.map(v => TypescriptGenerator.quotedString(v)).join("|")})`;
    }

    private generateNamedEnum(values: string[], name: string) {
        values = values.map(v => `${this._indent}${v.toUpperCase()}=\"${v}\"`);
        return `export enum ${name} {\n${values.join(",\n")}\n}\n`;
    }

    private generateNamedInterface(objectProperties: TypescriptGeneratorTypeInfoObjectPropertyMap, name: string)
    {
        return `export interface ${name} {\n${this.generateInterfaceBody(objectProperties, this._indent)}}\n`;
    }

    private generateInlineInterface(objectProperties: TypescriptGeneratorTypeInfoObjectPropertyMap, indent: string) 
    {
        return `{\n${this.generateInterfaceBody(objectProperties,indent + this._indent)}${indent}}`;
    }

    private generateInterfaceBody(objectProperties: TypescriptGeneratorTypeInfoObjectPropertyMap, indent: string)
    {
        let ret = "";
        for (let propName in objectProperties) {
            let propDef = objectProperties[propName];
            let optional = "?";
            if (propDef?.required ?? false) {
                optional = "";
            }
            try {
                ret += `${indent}${propName}${optional}: ${this.generateInlineType(propDef.typeInfo, indent)};\n`
            }
            catch(e) {
                throw `Error processing ${propName} ${e};`
            }
        }
        return ret;
    }
}
