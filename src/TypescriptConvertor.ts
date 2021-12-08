import { JsonSchema, JsonSchemaDefinition } from "./JsonSchema";
import { TypescriptNamedTypeMap, TypeScriptObjectPropertyMap, TypescriptType } from "./TypescriptDefinitions";
import 'ts-replace-all';

export class TypescriptConvertor
{
    private _schema: JsonSchema;
    
    public constructor(schema: JsonSchema)
    {
        this._schema = schema;
    }

    public static schemaIdToRelativePath(schemaId: string)
    {
        let paths = schemaId.split("/");
        let ret = [];
        for (let i = 0; i < paths.length; ++i) {
            let p = paths[i];
            if (p.length > 0) {
                ret.push("..");
            }
        }
        return ret.join('/');
    }

    public static schemaIdToName(schemaId: string) {
        return schemaId.replaceAll("/", "_");
    }

    public static schemaIdToTypeName(schemaId: string) {
        return `${this.schemaIdToName(schemaId)}.${JsonSchema.refTypeName(schemaId)}`;
    }

    public static schemaIdToTypeMapName(schemaId: string)
    {
        return `${JsonSchema.refTypeName(schemaId)}TypeMap`;
    }

    /**
    * @param rootTypeName The type name of the root element
    * @returns A mapping of type names to the type definitions
    */
    public namedTypescriptTypes(rootTypeName: string): TypescriptNamedTypeMap
    {
        let ret: TypescriptNamedTypeMap = {}
        for (let name in this._schema.defs) {
            ret[name] = this.toTypescriptType(this._schema.defs[name]);
        }
        
        ret[rootTypeName] = this.toTypescriptType(this._schema.schema);
        return ret;
    }
    
    public toTypescriptType(element: JsonSchemaDefinition): TypescriptType
    {
        if ("$ref" in element && element.$ref != undefined) {
            let ref = element.$ref;
            if (JsonSchema.isExternalRef(ref)) {
                let refName = JsonSchema.refTypeName(ref);
                return {
                    externalSchemaId: ref
                };
            }
            else {
                return { type: JsonSchema.refTypeName(ref) };
            }
        }
        else if ("type" in element) {
            let type = element.type;
            if (type == "array") {
                if (element.items == undefined) {
                    throw new Error(`Expecting items to be defined for array ${JSON.stringify(element)}`);
                }    
                return {
                    ...this.toTypescriptType(element.items),
                    array: true
                };
            }
            else if (type == "object") {
                let properties: TypeScriptObjectPropertyMap = {}
                let required:string[] = [];
                if ("required" in element && element.required != undefined) {
                    required = element.required;
                }
                for (let key in element.properties) {
                    let prop = element.properties[key];
                    properties[key] = {
                        required: required.indexOf(key) >= 0,
                        type: this.toTypescriptType(prop)
                    };
                }
                return {
                    object_properties: properties
                };
            }
            else if (type != "string") {
                return {type: type};
            }
            else {
                if ("format" in element) {
                    let format = element.format;
                    if (format == "date") {
                        return {type: "Date"};
                    }
                }
                else if ("enum" in element) {
                    return {
                        enum_values: element.enum
                    };
                }
                else {
                    return {
                        type: "string"
                    };
                }
            }
        }
        
        throw new Error(`Could not convert ${JSON.stringify(element)}`);
    } 
}
