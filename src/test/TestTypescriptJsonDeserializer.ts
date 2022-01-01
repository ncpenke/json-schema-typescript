import { expect } from "chai";
import { TypescriptGeneratorNamedTypeMap } from "../TypescriptGenerator";
import { TypescriptJsonDeserializer } from "../TypescriptJsonDeserializer";


describe("JSON Deserializer Tests", () => {
    it("Test pass through ", () => {
        let types: TypescriptGeneratorNamedTypeMap = {
            enum_type: {
                array: {
                    enumValues: [ "one", "two", "three" ]
                }
            }
        };
        let json = [
            "one", "one", "three"
        ];
        let deserializedJson = new TypescriptJsonDeserializer().deserialize(JSON.parse(JSON.stringify(json)), types.enum_type);
        expect(deserializedJson).to.deep.equal(json);
    });
    
    it("Test date conversion", () => {
        let types: TypescriptGeneratorNamedTypeMap = {
            object_type: {
                objectProperties: {
                    date_field: {
                        typeInfo: {
                            type: "Date"
                        }
                    },
                    other_field: {
                        typeInfo: {
                            type: "string"
                        }
                    },
                    object_type: {
                        typeInfo: {
                            objectProperties: {
                                date_field: {
                                    typeInfo: {
                                        type: "Date"
                                    }
                                }
                            }
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
        let deserializedJson = new TypescriptJsonDeserializer().deserialize(JSON.parse(JSON.stringify(dateJson)), types.object_type);
        expect(deserializedJson).to.deep.equal(dateJson);
    });
    
    it("Test external schema deserialization", () => {
        let externalTypeMap: TypescriptGeneratorNamedTypeMap = {
            root_type: {
                objectProperties: {
                    string_field: {
                        typeInfo: {
                            type: "string"
                        }
                    },
                    object_field: {
                        typeInfo: {
                            objectProperties: {
                                number_field: {
                                    typeInfo: {
                                        type: "number"
                                    }
                                }
                            }
                            
                        }
                    }
                }
            }
        };
        
        let types: TypescriptGeneratorNamedTypeMap = {
            object_type: {
                objectProperties: {
                    external_object: {
                        typeInfo: externalTypeMap.root_type
                    },
                }
            },
        };
        
        let json = {
            external_object: {
                string_field: "test",
                object_field: {
                    number_field: 100
                }
            }
        }
        let deserializedJson = new TypescriptJsonDeserializer().deserialize(JSON.parse(JSON.stringify(json)), types.object_type);
        expect(deserializedJson).to.deep.equal(json);
    });
});
