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
    "$id"?: string;
    "$defs"?: {[key:string]:JsonSchemaDefinition};
}

/**
 * Encapsulates converting JSON schema to TypeScript definitions
 */
export class JsonSchema
{
    private _schema: JsonSchemaRootDefinition;
    
    public static _schemaMap: {[key:string]: JsonSchemaRootDefinition} = {};

    public static refTypeName(ref: string)
    {
        let refPath = ref.split("/");
        return refPath[refPath.length - 1];
    }

    public static isExternalRef(ref: string)
    {
        return ref.length > 0 && ref[0] != "#";
    }

    public constructor(schema: JsonSchemaRootDefinition)
    {
        this._schema = schema;
        let id = schema?.$id ?? "";
        if (id.length > 0) {
            JsonSchema._schemaMap[id] = schema;
        }
    }

    public get schema() { return this._schema; }

    public get defs() { return this._schema?.$defs ?? {}; }

    public resolveRef(ref: string): JsonSchemaDefinition  
    {
        if (!JsonSchema.isExternalRef(ref)) {
            let resolvedName = JsonSchema.refTypeName(ref);
            if (this._schema.$defs == undefined || !(resolvedName in this._schema.$defs)) {
                throw new Error(`Internal ${ref} not found`);
            }
            return this._schema.$defs[resolvedName];
        }
        else {
            if (ref in JsonSchema._schemaMap) {
                return JsonSchema._schemaMap[ref];
            }
            else {
                throw new Error(`External ${ref} not found`);
            }
        }
    }
}
