import * as yargs from 'yargs';
import * as fs from 'fs';
import * as path from 'path';
import { JsonSchema } from '../JsonSchema';
import { TypescriptGenerator } from '../TypescriptGenerator';

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
            let namedTypes = jsonSchema.namedTypescriptTypes(args["schema-name"] as string);
            let outDir = args["output-dir"] as string;
            let schemaName = path.win32.basename(inputFileName, path.extname(inputFileName));

            if (!fs.existsSync(outDir)) {
                fs.mkdirSync(outDir);
            }

            fs.writeFileSync(`${args["output-dir"]}/${schemaName}Json.ts`, JSON.stringify(namedTypes, null, "    "));
            fs.writeFileSync(`${args["output-dir"]}/${schemaName}Types.ts`, generator.generateTypes(namedTypes));
        }
    })
    .help()
    .strict(true)
    .showHelpOnFail(true)
    .demandCommand()
    .argv;
