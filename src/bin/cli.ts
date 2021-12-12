#!/usr/bin/env node

import * as yargs from 'yargs';
import * as fs from 'fs';
import * as path from 'path';
import { JsonSchemaRootDefinition, TypescriptGenerator } from '../TypescriptGenerator';

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
            let jsonSchema = JSON.parse(fs.readFileSync(inputFileName).toString()) as JsonSchemaRootDefinition;
            let schemaName = path.win32.basename(inputFileName, path.extname(inputFileName));
            let generator = new TypescriptGenerator(jsonSchema, schemaName, indent);
            let outDir = args["output-dir"] as string;

            let schemaFilePath = path.join(outDir, `${schemaName}.ts`);
            let schemaFileDir = path.win32.dirname(schemaFilePath);
            if (!fs.existsSync(schemaFileDir)) {
                fs.mkdirSync(schemaFileDir, {
                    recursive: true
                });
            }

            fs.writeFileSync(schemaFilePath, generator.generate());
        }
    })
    .help()
    .strict(true)
    .showHelpOnFail(true)
    .demandCommand()
    .argv;
