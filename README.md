# json-schema-typescript

Generate typescript interfaces and deserializer logic from a JSON schema

Features:

- Generate named interfaces and enums for each definition
- Generate inline interfaces and enums for each property that doesn't have an explicit definition
- Generate a deserializer for a JSON object tree to use the format to convert to native types

Assumptions:

- All definitions are in the top-level "$defs" property

Note:
- Features in JSON schema which result in ambiguous during deserialization are not supported.
