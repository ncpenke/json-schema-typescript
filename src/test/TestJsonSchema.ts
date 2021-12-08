import { expect } from "chai";
import { JsonSchema, JsonSchemaRootDefinition } from "../JsonSchema"

describe("JSON Schema Tests", () => {
    {
        let rootSchema = {
            "$defs": {
                "string_type": {
                    "type": "string"
                }
            },
            "properties": {
                "string_field": {
                    "$ref": "#/$defs/string_type"
                },
                "array_field": {
                    "type": "array",
                    "items": {
                        "$ref": "#/$defs/string_type"
                    }
                },
                "array_field_2": {
                    "type": "array",
                    "items": {
                        "type": "number"
                    }
                },
                "date_field": {
                    "type": "string",
                    "format": "date"
                },
                "object_field": {
                    "type": "object",
                    "properties": {
                        "boolean_field": {
                            "type": "boolean"
                        },
                        "number_field": {
                            "type": "number"
                        }
                    }
                },
                "object_with_required_fields": {
                    "type": "object",
                    "properties": {
                        "boolean_field": {
                            "type": "boolean"
                        },
                        "number_field": {
                            "type": "number"
                        }
                    },
                    "required": [ "boolean_field" ]
                },
                "external_reference": {
                    "$ref": "/schema/external"
                }
            }
        } as JsonSchemaRootDefinition;

        let externalSchema = {
            "$id": "/schema/external",
            "properties": {
                "string_field": {
                    "type": "string"
                }
            },
            "type": "object"
        } as JsonSchemaRootDefinition;

        let schema = new JsonSchema(rootSchema);
        let externalSchemaObj = new JsonSchema(externalSchema);

        it("Test resolving internal refs success", () => {
            expect(schema.resolveRef("#/$defs/string_type")).to.deep.equal({ "type": "string"});
        });

        it("Test resolving refs fail", () => {
            expect(schema.resolveRef.bind(schema, "#/$defs/non_existent")).to.throw;
        });

        it ("Test external reference fail", () => {
            expect(schema.resolveRef.bind(schema, "/non_existent")).to.throw;
        });

        it ("Test external reference success", () => {
            expect(schema.resolveRef("/schema/external")).to.deep.equal(externalSchema);
        });
    }
});
