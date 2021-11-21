import { TypescriptType } from "./TypescriptDefinitions";

export class JsonDeserializer
{    
    public deserialize(json: any, type: TypescriptType): any
    {
        if ("array" in type && type.array)
        {
            let objectType = {
                ...type,
                array: false
            };
            return (json as []).map(obj => {
                return this.deserialize(obj, objectType)
            });
        }
        else if ("object_properties" in type) {
            let ret = {
                ...json
            };
            for (let key in type.object_properties) {
                if (key in json) {
                    ret[key] = this.deserialize(json[key], type.object_properties[key].type);
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
            if (type.type == "Date") {
                return new Date(json);
            }
            else {
                return json;
            }
        }
        else {
            throw `Could not process JSON ${JSON.stringify(json)}`;
        }
    }
}
