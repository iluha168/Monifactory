import { Category, zCategory } from "./schema.mts"

export const categories: Category[] = await Deno.readTextFile("../logs/emi-dump.json")
	.then(JSON.parse)
	.then((json) => zCategory.array().parseAsync(json))
