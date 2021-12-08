import { TypescriptNamedTypeMap, TypescriptType } from "./TypescriptDefinitions";

const gBuiltinTypes = [ "string", "boolean", "number" ];

export interface TypescriptJsonDeserializerEntry
{
    map: TypescriptNamedTypeMap;
    rootType: string;
}

export class TypescriptJsonDeserializer
{   

    private static _schemaTypeMaps:{[key:string]: TypescriptJsonDeserializerEntry}  = {};

    public static register(key: string, entry: TypescriptJsonDeserializerEntry)
    {
        this._schemaTypeMaps[key] = entry;
    }

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
        else if ("object_properties" in type && type.object_properties != undefined) {
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
        else if ("enum_values" in type && type.enum_values != undefined) {
            if (type.enum_values.indexOf(json as string) < 0) {
                throw `Enum value ${JSON.stringify(json)} not found`;
            }
            return json;
        }
        else if ("type" in type && type.type != undefined) {
            let t = type.type;
            if (t == "Date") {
                return new Date(json);
            }
            else if (gBuiltinTypes.indexOf(t) >= 0) {
                return json;
            }
            else {
                if ("externalSchemaId" in type && type.externalSchemaId != undefined) {
                    let entry = TypescriptJsonDeserializer._schemaTypeMaps[type.externalSchemaId];
                    return this.deserialize(json, entry.map[entry.rootType], entry.map);
                }
                else {
                    return this.deserialize(json, typeMap[t], typeMap);
                }
            }
        }
        else {
            throw `Could not process JSON ${JSON.stringify(json)}`;
        }
    }
}
