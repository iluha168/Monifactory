import { fetchCategory } from "../index.mts";
import { SimpleStack } from "../schema.mts";

const assemblyLine = await fetchCategory("gtceu:assembly_line")
if (!assemblyLine)
    Deno.exit(1)

for (const [len, recipes] of Object.entries(
    Object.groupBy(
        assemblyLine
            .recipes
            .filter(recipe => !!recipe)
            .map(recipe => ({
                inputsLen: recipe.inputs.length,
                outputStack: recipe.outputs[0],
            })),
        item => item.inputsLen,
    )
)) {
    if (!recipes) continue
    const outputs = new Set(recipes.map(
        r => (r.outputStack as SimpleStack).id.split(":", 2)[1]
    ))
    console.log(`${recipes.length} recipes of ${len} inputs${
        outputs.size <= 3 ? ` (${outputs.values().toArray()})` : ""
    }`)
}
