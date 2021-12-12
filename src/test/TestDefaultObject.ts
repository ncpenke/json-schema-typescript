import { expect } from "chai";
import { stringifyDefaultObject } from "../DefaultObject";

describe("stringifyDefaultObjectTess", () => {
    it("stringifies correctly", () => {
        expect(stringifyDefaultObject({
            field1: '"string"',
            field2: {
                nestedField: "TestType"
            },
            field3: [
                "123", "456", "780"
            ],
            field4: [
                {
                    test: "1"
                },
                {
                    field2: "2"
                }
            ]
        }, "", "    ")).to.equal(
`{
    field1: "string",
    field2: {
        nestedField: TestType
    },
    field3: [
        123,
        456,
        780
    ],
    field4: [
        {
            test: 1
        },
        {
            field2: 2
        }
    ]
}`
        );
    });
});