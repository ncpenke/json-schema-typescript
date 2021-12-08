import { expect } from "chai";
import { JsonSchema, JsonSchemaRootDefinition } from "../JsonSchema"
import { TypescriptConvertor } from "../TypescriptConvertor";
import { TypescriptType } from "../TypescriptDefinitions";

describe("Typescript Convertor Tests", () => {
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
        let covnertor = new TypescriptConvertor(schema);
        let externalSchemaObj = new JsonSchema(externalSchema);

        it("Test toTypescriptType arrays", () => {
            expect(covnertor.toTypescriptType(rootSchema?.properties?.array_field ?? {})).to.deep.equal(
                {
                    array: true,
                    type: "string_type"
                } as TypescriptType
            );
            expect(covnertor.toTypescriptType(rootSchema?.properties?.array_field_2 ?? {})).to.deep.equal(
                {
                    array: true,
                    type: "number"
                } as TypescriptType
            );
        });

        it("Test date field", () => {
            expect(covnertor.toTypescriptType(rootSchema?.properties?.date_field ?? {})).to.deep.equal(
                {
                    type: "Date"
                } as TypescriptType
            );
        });

        it ("Test object field", () => {
            expect(covnertor.toTypescriptType(rootSchema?.properties?.object_field ?? {})).to.deep.equal(
                {
                    object_properties: {
                        "boolean_field": {
                            required: false,
                            type: { type: "boolean" }
                        },
                        "number_field": {
                            required: false,
                            type: { type: "number" }
                        }
                    }
                } as TypescriptType
            );

            expect(covnertor.toTypescriptType(rootSchema?.properties?.object_with_required_fields ?? {})).to.deep.equal(
                {
                    object_properties: {
                        "boolean_field": {
                            required: true,
                            type: { type: "boolean" }
                        },
                        "number_field": {
                            required: false,
                            type: { type: "number" }
                        }
                    }
                } as TypescriptType
            );

            expect(covnertor.toTypescriptType(rootSchema?.properties?.external_reference ?? {})).to.deep.equal(
                {
                    externalSchemaId: "/schema/external"
                } as TypescriptType
            );
        });
    }

    it ("Test namedTypescriptTypes", () => {
        let rootSchema = {
            $defs: {
                named_enum: {
                    type: "string",
                    enum: [ "one", "two", "three" ]
                }
            },
            type: "object",
            properties: {
                enum_field: {
                    $ref: "#/$defs/named_enum"
                }
            }
        } as JsonSchemaRootDefinition;
        let schema = new JsonSchema(rootSchema);
        let convertor = new TypescriptConvertor(schema);
        expect(convertor.namedTypescriptTypes("root")).to.deep.equal(
            {
                root: {
                    object_properties: {
                        "enum_field": {
                            required: false,
                            type: { type: "named_enum" }
                        }
                    }    
                },
                named_enum: {
                    enum_values: [ "one", "two", "three" ]
                }
            } as TypescriptType
        );
    });
});
