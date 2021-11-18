import { expect } from "chai";
import { JsonSchema, JsonSchemaRootDefinition } from "../JsonSchema"
import { TypescriptType } from "../TypescriptDefinitions";

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
                }
            }
        } as JsonSchemaRootDefinition;
        let schema = new JsonSchema(rootSchema);
        it("Test resolving refs", () => {
            expect(schema.resolveRef("#/$defs/string_type")).to.deep.equal({ "type": "string"});
        });

        it("Test toTypescriptType arrays", () => {
            expect(schema.toTypescriptType(rootSchema.properties.array_field)).to.deep.equal(
                {
                    array: true,
                    type: "string_type"
                } as TypescriptType
            );
            expect(schema.toTypescriptType(rootSchema.properties.array_field_2)).to.deep.equal(
                {
                    array: true,
                    type: "number"
                } as TypescriptType
            );
        });

        it("Test date field", () => {
            expect(schema.toTypescriptType(rootSchema.properties.date_field)).to.deep.equal(
                {
                    type: "Date"
                } as TypescriptType
            );
        });

        it ("Test object field", () => {
            expect(schema.toTypescriptType(rootSchema.properties.object_field)).to.deep.equal(
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

            expect(schema.toTypescriptType(rootSchema.properties.object_with_required_fields)).to.deep.equal(
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
        expect(schema.namedTypescriptTypes("root")).to.deep.equal(
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
