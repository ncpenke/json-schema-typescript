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
}

export interface TypescriptNamedType extends TypescriptType
{
    name: string;
}
