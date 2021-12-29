import { expect } from "chai";
import { JsonSchemaRootDefinition, TypescriptGenerator, TypescriptGeneratorNamedTypeMap, TypescriptGeneratorTypeInfo } from "../TypescriptGenerator";
import * as fs from 'fs';

let rootFname = "src/test/RootTestSchema.json";

describe("TypescriptGenerator.toGeneratorTypeInfo Tests", () => {
    let rootSchema = JSON.parse(fs.readFileSync(rootFname).toString()) as JsonSchemaRootDefinition;

    it("Test arrays", () => {
        expect(TypescriptGenerator.toGeneratorTypeInfo(rootSchema?.properties?.array_field ?? {}, rootSchema)).to.deep.equal(
            {
                array: {
                    typeRef: "#/$defs/string_type"
                }
            } as TypescriptGeneratorTypeInfo
        );

        expect(TypescriptGenerator.toGeneratorTypeInfo(rootSchema?.properties?.array_field_2 ?? {}, rootSchema)).to.deep.equal(
            {
                array: {
                    type: "number"
                }
            } as TypescriptGeneratorTypeInfo
        );
    });

    it("Test date", () => {
        expect(TypescriptGenerator.toGeneratorTypeInfo(rootSchema?.properties?.date_field ?? {}, rootSchema)).to.deep.equal(
            {
                type: "Date"
            } as TypescriptGeneratorTypeInfo
        );
    });

    it("Test unknown format field", () => {
        expect(TypescriptGenerator.toGeneratorTypeInfo(rootSchema?.properties?.unknown_format_field ?? {}, rootSchema)).to.deep.equal(
            {
                type: "string"
            } as TypescriptGeneratorTypeInfo
        );
    });

    it ("Test object field", () => {
        expect(TypescriptGenerator.toGeneratorTypeInfo(rootSchema?.properties?.object_field ?? {}, rootSchema)).to.deep.equal(
            {
                objectProperties: {
                    "boolean_field": {
                        typeInfo: { type: "boolean" }
                    },
                    "number_field": {
                        typeInfo: { type: "number" }
                    }
                }
            } as TypescriptGeneratorTypeInfo
        );

        expect(TypescriptGenerator.toGeneratorTypeInfo(rootSchema?.properties?.object_with_required_fields ?? {}, rootSchema)).to.deep.equal(
            {
                objectProperties: {
                    "boolean_field": {
                        required: true,
                        typeInfo: { type: "boolean" }
                    },
                    "number_field": {
                        typeInfo: { type: "number" }
                    }
                }
            } as TypescriptGeneratorTypeInfo
        );

        expect(TypescriptGenerator.toGeneratorTypeInfo(rootSchema?.properties?.external_reference ?? {}, rootSchema)).to.deep.equal(
            {
                typeRef: "./ExternalTestSchema.json"
            } as TypescriptGeneratorTypeInfo
        );
    });
});

describe("TypescriptGenerator.generateNamedTypes Tests", () => {
    it("Test generate named enum ", () => {
        let types: TypescriptGeneratorNamedTypeMap = {
            enum_type: {
                enumValues: [ "one", "two", "three" ]
            }
        };
        expect((new TypescriptGenerator({}, "", "    ")).generateNamedTypes(types).join('')).to.equal(
`export enum enum_type {
    ONE="one",
    TWO="two",
    THREE="three"
}
`
        )
    });

    it("Test generate named interface ", () => {
        let types: TypescriptGeneratorNamedTypeMap = {
            object_type: {
                objectProperties: {
                    field1: {
                        required: true,
                        typeInfo: {
                            type: "string"
                        }
                    },
                    inlineInterface: {
                        required: true,
                        typeInfo: {
                            objectProperties: {
                                field1: {
                                    typeInfo: {
                                        type: "number"
                                    }
                                },
                                field2: {
                                    typeInfo: {
                                        array: {
                                            type: "string"
                                        }
                                    }
                                }
                            }
                        }
                    },
                    inlineEnum: {
                        typeInfo: { enumValues: [ "one", "two", "three" ] }
                    },
                    inlineEnumArray: {
                        typeInfo: {
                            array: {
                                enumValues: [ "one", "two", "three" ]
                            }
                        }
                    }
                }
            },
            array_type: {
                array: {
                    type: "string"
                }
            }
        };

        expect(new TypescriptGenerator({}, "", "    ").generateNamedTypes(types).join("")).to.equal(
`export interface object_type {
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
        let types: TypescriptGeneratorNamedTypeMap = {
            object_type: {
                objectProperties: {
                    field1: {
                        required: true,
                        typeInfo: {
                            typeRef: "./External.json"
                        }
                    },
                }
            },
            array_type: {
                array: {
                    type: "string"
                }
            }
        };

        expect(new TypescriptGenerator({}, "", "    ").generateNamedTypes(types).join("")).to.equal(
`export interface object_type {
    field1: _External.External;
}
export type array_type = string[];
`
        );
    });
});

describe("TypescriptGenerator.generateNamedTypeInfo Tests", () => {
    it("Test generate named enum ", () => {
        let types: TypescriptGeneratorNamedTypeMap = {
            enum_type: {
                enumValues: [ "one", "two", "three" ]
            }
        };
        expect(TypescriptGenerator.generateNamedTypeInfo(types, ["enum_type"], "    ").join("")).to.equal(
`export let enum_typeTypeInfo: TypescriptJsonDeserializerTypeInfo = {
    enumValues: [
        "one",
        "two",
        "three"
    ]
};
`
        );
    });

    it("Test generate named interface ", () => {
        let types: TypescriptGeneratorNamedTypeMap = {
            object_type: {
                objectProperties: {
                    field1: {
                        required: true,
                        typeInfo: {
                            type: "string"
                        }
                    },
                    inlineInterface: {
                        required: true,
                        typeInfo: {
                            objectProperties: {
                                field1: {
                                    typeInfo: {
                                        type: "number"
                                    }
                                },
                                field2: {
                                    typeInfo: {
                                        array: {
                                            type: "string"
                                        }
                                    }
                                },
                                field3: {
                                    typeInfo: {
                                        typeRef: "#/$defs/Test"
                                    }
                                }
                            }
                        }
                    },
                    inlineEnum: {
                        typeInfo: { enumValues: [ "one", "two", "three" ] }
                    },
                    inlineEnumArray: {
                        typeInfo: {
                            array: {
                                enumValues: [ "one", "two", "three" ]
                            }
                        }
                    }
                }
            },
            array_type: {
                array: {
                    type: "string"
                }
            }
        };

        expect(TypescriptGenerator.generateNamedTypeInfo(types, ["object_type", "array_type"], "    ").join("")).to.equal(
`export let object_typeTypeInfo: TypescriptJsonDeserializerTypeInfo = {
    objectProperties: {
        field1: {
            typeInfo: {
                type: "string"
            },
            required: true
        },
        inlineInterface: {
            typeInfo: {
                objectProperties: {
                    field1: {
                        typeInfo: {
                            type: "number"
                        }
                    },
                    field2: {
                        typeInfo: {
                            array: {
                                type: "string"
                            }
                        }
                    },
                    field3: {
                        typeInfo: TestTypeInfo
                    }
                }
            },
            required: true
        },
        inlineEnum: {
            typeInfo: {
                enumValues: [
                    "one",
                    "two",
                    "three"
                ]
            }
        },
        inlineEnumArray: {
            typeInfo: {
                array: {
                    enumValues: [
                        "one",
                        "two",
                        "three"
                    ]
                }
            }
        }
    }
};
export let array_typeTypeInfo: TypescriptJsonDeserializerTypeInfo = {
    array: {
        type: "string"
    }
};
`
        );
    });

    it("Test generate refs to external schema ", () => {
        let types: TypescriptGeneratorNamedTypeMap = {
            object_type: {
                objectProperties: {
                    field1: {
                        required: true,
                        typeInfo: {
                            typeRef: "./External.json"
                        }
                    }
                }
            }
        };

        expect(TypescriptGenerator.generateNamedTypeInfo(types, ["object_type"], "    ").join("")).to.equal(
`export let object_typeTypeInfo: TypescriptJsonDeserializerTypeInfo = {
    objectProperties: {
        field1: {
            typeInfo: _External.ExternalTypeInfo,
            required: true
        }
    }
};
`
        );
    });
});


describe("TypescriptGenerator.generateImports Tests", () => {
    let rootSchema = JSON.parse(fs.readFileSync(rootFname).toString()) as JsonSchemaRootDefinition;
    let generator = new TypescriptGenerator(rootSchema, "", "    ");
    it ("Test imports", () => {
        expect(generator.generateImports().join("")).to.equal(
`import * as _ExternalTestSchema from "./ExternalTestSchema";
import { TypescriptJsonDeserializerTypeInfo } from 'json-schema-typescript';
`
        );
    });
})

describe("TypescriptGenerator.determineDependencyOrder Tests", () => {
    let rootSchema = JSON.parse(fs.readFileSync(rootFname).toString()) as JsonSchemaRootDefinition;
    let generator = new TypescriptGenerator(rootSchema, "RootTestSchema", "    ");
    it ("Tets deps", () => {
        expect(generator.determineDependencyOrder()).to.deep.equal([
            "string_type", "RootTestSchema"
        ]);
    });
});