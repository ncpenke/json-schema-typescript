import { expect } from "chai";
import { TypescriptNamedTypeMap, TypescriptType } from "../TypescriptDefinitions";
import { TypescriptGenerator } from "../TypescriptGenerator";

describe("Typescript Generator Tests", () => {
    it("Test generate named enum ", () => {
        let types: TypescriptNamedTypeMap = {
            enum_type: {
                enum_values: [ "one", "two", "three" ]
            }
        };
        expect(new TypescriptGenerator("    ").generateTypes(types, "")).to.equal(
`import * as jst from 'json-schema-typescript'
export enum enum_type {
    ONE="one",
    TWO="two",
    THREE="three"
}
`
        )
    });

    it("Test generate named interface ", () => {
        let types: TypescriptNamedTypeMap = {
            object_type: {
                object_properties: {
                    field1: {
                        required: true,
                        type: {
                            type: "string"
                        }
                    },
                    inlineInterface: {
                        required: true,
                        type: {
                            object_properties: {
                                field1: {
                                    type: {
                                        type: "number"
                                    }
                                },
                                field2: {
                                    type: {
                                        type: "string",
                                        array: true
                                    }
                                }
                            }
                        }
                    },
                    inlineEnum: {
                        type: { enum_values: [ "one", "two", "three" ] }
                    },
                    inlineEnumArray: {
                        type: { enum_values: [ "one", "two", "three" ], array: true }
                    }
                }
            },
            array_type: {
                array: true,
                type: "string"
            }
        };

        expect(new TypescriptGenerator("    ").generateTypes(types, "")).to.equal(
`import * as jst from 'json-schema-typescript'
export interface object_type {
    field1: string;
    inlineInterface: {
        field1?: number;
        field2?: string[];
    };
    inlineEnum?: (one|two|three);
    inlineEnumArray?: (one|two|three)[];
}
export type array_type = string[];
`
        );

    });

    it("Test generate refs to external schema ", () => {
        let types: TypescriptNamedTypeMap = {
            object_type: {
                object_properties: {
                    field1: {
                        required: true,
                        type: {
                            externalSchemaId: "/schemas/external"
                        }
                    },
                }
            },
            array_type: {
                array: true,
                type: "string"
            }
        };

        expect(new TypescriptGenerator("    ").generateTypes(types, "/schemas/Main")).to.equal(
`import * as jst from 'json-schema-typescript'
import * as _schemas_external from "../schemas/external";
export interface object_type {
    field1: _schemas_external.external;
}
export type array_type = string[];
jst.TypescriptJsonDeserializer.register("/schemas/Main", { map: MainTypeMap, rootType: "Main" });
`
        );

    });
});
