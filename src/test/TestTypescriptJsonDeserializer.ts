import { expect } from "chai";
import { TypescriptJsonDeserializer } from "../TypescriptJsonDeserializer";
import { TypescriptNamedTypeMap, TypescriptType } from "../TypescriptDefinitions";

describe("JSON Deserializer Tests", () => {
    it("Test pass through ", () => {
        let types: TypescriptNamedTypeMap = {
            enum_type: {
                array: true,
                enum_values: [ "one", "two", "three" ]
            }
        };
        let json = [
            "one", "one", "three"
        ];
        let deserializedJson = new TypescriptJsonDeserializer().deserialize(JSON.parse(JSON.stringify(json)), types["enum_type"], types);
        expect(deserializedJson).to.deep.equal(json);
    });

    it("Test date conversion", () => {
        let types: TypescriptNamedTypeMap = {
            object_type: {
                object_properties: {
                    date_field: {
                        type: {
                            type: "Date"
                        }
                    },
                    object_type: {
                        type: {
                            type: "nested_object_type"
                        }
                    }
                }
            },
            nested_object_type: {
                object_properties: {
                    date_field: {
                        type: {
                            type: "Date"
                        }
                    }
                }
            }
        };
        let dateJson = {
            date_field: new Date(2021, 10, 10),
            other_field: "123",
            object_type: {
                date_field: new Date(2021, 10, 11),
            }
        }
        let deserializedJson = new TypescriptJsonDeserializer().deserialize(JSON.parse(JSON.stringify(dateJson)), types["object_type"], types);
        expect(deserializedJson).to.deep.equal(dateJson);
    });

    it("Test external schema deserialization", () => {
        let types: TypescriptNamedTypeMap = {
            object_type: {
                object_properties: {
                    external_object: {
                        type: {
                            externalSchemaId: "/test/external"
                        }
                    },
                }
            },
        };

        let externalTypeMap: TypescriptNamedTypeMap = {
            root_type: {
                object_properties: {
                    string_field: {
                        type: {
                            type: "string"
                        }
                    },
                    object_field: {
                        type: {
                            type: "another_object_type"
                        }
                    }
                }
            },
            another_object_type: {
                object_properties: {
                    number_field: {
                        type: {
                            type: "number"
                        }
                    }
                }
            }
        };

        let json = {
            external_object: {
                string_field: "test",
                object_field: {
                    number_field: 100
                }
            }
        }
        TypescriptJsonDeserializer.register("/test/external", {
            map: externalTypeMap,
            rootType: "root_type"
        });
        let deserializedJson = new TypescriptJsonDeserializer().deserialize(JSON.parse(JSON.stringify(json)), types["object_type"], types);
        expect(deserializedJson).to.deep.equal(json);
    });
});
