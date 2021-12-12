const gBuiltinTypes = [ "string", "boolean", "number", "Date" ];

/**
 * Captures type information used by the deserializer to perform conversions and to traverse
 * arrays and objects.
 */
export interface TypescriptJsonDeserializerTypeInfo
{
    array?: TypescriptJsonDeserializerTypeInfo;
    objectProperties?: {[name:string]: 
        {
            required?: boolean,
            typeInfo: TypescriptJsonDeserializerTypeInfo
        }
    };
    enumValues?: string[];
    type?: string;
}

export class TypescriptJsonDeserializer
{   
    public deserialize(json: any, typeInfo: TypescriptJsonDeserializerTypeInfo): any
    {
        if (typeInfo?.array != undefined)
        {
            let arr = typeInfo.array;
            return (json as []).map(obj => {
                return this.deserialize(obj, arr)
            });
        }
        else if (typeInfo?.type != undefined) {
            let builtIn = typeInfo.type;
            if (gBuiltinTypes.indexOf(builtIn) < 0) {
                throw new Error(`Builtin type ${builtIn} not found`);
            }
            if (builtIn == "Date") {
                return new Date(json);
            } 
            return json;
        }
        else if (typeInfo?.objectProperties != undefined) {
            let ret:any = {};
            for (let key in typeInfo.objectProperties) {
                let prop = typeInfo.objectProperties[key];
                if (key in json) {
                    ret[key] = this.deserialize(json[key], prop.typeInfo);
                }
                else if (prop.required) {
                    throw new Error(`Required key ${key} not found`);
                }
            }
            return ret;
        }
        else if (typeInfo?.enumValues != undefined) {
            if (typeInfo.enumValues.indexOf(json as string) < 0) {
                throw `Enum value ${JSON.stringify(json)} not found`;
            }
            return json;
        }
        else {
            throw new Error(`Could not process type ${JSON.stringify(typeInfo)} JSON ${JSON.stringify(json)}`);
        }
    }
}
