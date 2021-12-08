export type TypeScriptObjectPropertyMap = {
    [name:string]: {
        required?: boolean,
        type: TypescriptType
    }
};

export interface TypescriptType
{
    type?: string;
    array?: boolean;
    enum_values?: string[];
    object_properties?: TypeScriptObjectPropertyMap;
    externalSchemaId?: string;
}

export type TypescriptNamedTypeMap = {
    [name:string]: TypescriptType
};
