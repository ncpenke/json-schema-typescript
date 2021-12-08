# json-schema-typescript

Generate typescript interfaces and deserializer logic from a JSON schema

Features

- Generate named interfaces and enums for each definition in the top-level "$defs" property
- Generate inline interfaces and enums for each property that doesn't have an explicit definition
- Handle references to external schemas.
- Implements a deserializer for a JSON object tree to use the format to convert to native types

Assumptions:

- All definitions are in the top-level "$defs" property

Note:
- Features in JSON schema which result in ambiguous during deserialization are not supported.

## Implementation Notes

1. The JSON schema is first converted to an intermediate representation that also provides type definitions to the JSON deserializer.

2. All root types register their type maps with the TypescriptJsonDeserializer class to allow the deserializer to find the root type definitions at runtime. This allows external schema references to be deserialized. 