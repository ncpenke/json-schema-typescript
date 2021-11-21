import { TypescriptNamedTypeMap, TypescriptType } from "./TypescriptDefinitions";

const gBuiltinTypes = [ "string", "boolean", "number" ];

export class JsonDeserializer
{    
    public deserialize(json: any, type: TypescriptType, typeMap: TypescriptNamedTypeMap): any
    {
        if ("array" in type && type.array)
        {
            let objectType = {
                ...type,
                array: false
            };
            return (json as []).map(obj => {
                return this.deserialize(obj, objectType, typeMap)
            });
        }
        else if ("object_properties" in type) {
            let ret = {
                ...json
            };
            for (let key in type.object_properties) {
                if (key in json) {
                    ret[key] = this.deserialize(json[key], type.object_properties[key].type, typeMap);
                }
            }
            return ret;
        }
        else if ("enum_values" in type) {
            if (type.enum_values.indexOf(json as string) < 0) {
                throw `Enum value ${JSON.stringify(json)} not found`;
            }
            return json;
        }
        else if ("type" in type) {
            let t = type.type;
            if (t == "Date") {
                return new Date(json);
            }
            else if (gBuiltinTypes.indexOf(t) >= 0) {
                return json;
            }
            else {
                return this.deserialize(json, typeMap[t], typeMap);
            }
        }
        else {
            throw `Could not process JSON ${JSON.stringify(json)}`;
        }
    }
}
