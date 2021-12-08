#!/usr/bin/env node

import * as yargs from 'yargs';
import * as fs from 'fs';
import * as path from 'path';
import { JsonSchema } from '../JsonSchema';
import { TypescriptGenerator } from '../TypescriptGenerator';
import { TypescriptConvertor } from '../TypescriptConvertor';

let args = yargs.scriptName("json-schema-typescript")
    .command(
    {
        command: ["$0"],
        describe: "Generate typescript types and deserializer from JSON schema", 
        builder: (args: yargs.Argv) => {
            return yargs.option('input', {
                describe: "The path of the schema",
                demandOption: true
            })
            .alias({"i": "input"})
            .option('output-dir', {
                describe: "The output directory",
                demandOption: true
            })
            .alias("o", "output-dir")
        },
        handler: (args: yargs.Arguments) => {
            let indent = "    ";
            let inputFileName = args["input"] as string;
            let jsonSchema = new JsonSchema(JSON.parse(fs.readFileSync(inputFileName).toString()));
            let generator = new TypescriptGenerator(indent);
            let schemaId = jsonSchema.schema?.$id ?? path.win32.basename(inputFileName, path.extname(inputFileName));
            let convertor = new TypescriptConvertor(jsonSchema);
            let namedTypes = convertor.namedTypescriptTypes(schemaId);
            let outDir = args["output-dir"] as string;

            let schemaFilePath = path.join(outDir, `${schemaId}.ts`);
            let schemaFileDir = path.win32.dirname(schemaFilePath);
            if (!fs.existsSync(schemaFileDir)) {
                fs.mkdirSync(schemaFileDir);
            }

            let generatedTypes =  generator.generateTypes(namedTypes, schemaId, true);

            fs.writeFileSync(
                schemaFilePath,
                `
${generatedTypes}
`);
        }
    })
    .help()
    .strict(true)
    .showHelpOnFail(true)
    .demandCommand()
    .argv;
