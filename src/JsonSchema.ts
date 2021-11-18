import { TypeScriptObjectPropertyMap, TypescriptType } from "./TypescriptDefinitions";

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

export interface JsonSchemaRootDefinition extends JsonSchemaDefinition
{
    "$defs"?: {[key:string]:JsonSchemaDefinition};
}

export class JsonSchema
{
    _schema: JsonSchemaRootDefinition;

    public constructor(schema: JsonSchemaRootDefinition)
    {
        this._schema = schema;
    }

    private resolvedRefName(ref: string)
    {
        let refPath = ref.split("/");
        if (refPath.length != 3) {
            throw `Ref path error ${ref}. Ref must be of format #/$defs/<ref_name>`
        }
        if (refPath[0] != "#") {
            throw `Ref path error ${ref}. Non-local ref paths are not supported`;
        }
        if (refPath[1] != "$defs") {
            throw `Ref path error ${ref}. All refs must be in $defs`;
        }
        return refPath[2];
    }

    public resolveRef(ref: string): JsonSchemaDefinition  
    {
        return this._schema.$defs[this.resolvedRefName(ref)];
    }

    public toTypescriptType(element: JsonSchemaDefinition): TypescriptType
    {
        if ("$ref" in element) {
            return { type: this.resolvedRefName(element.$ref) };
        }
        else if ("type" in element) {
            let type = element.type;
            if (type == "array") {
                return {
                    ...this.toTypescriptType(element.items),
                    array: true
                };
            }
            else if (type == "object") {
                let properties: TypeScriptObjectPropertyMap = {}
                let required:string[] = [];
                if ("required" in element) {
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
    }
}
