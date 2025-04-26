import { z } from "zod"
import { parse } from "path/parse"
import { zCategory, zStacksFile } from "./schema.mts"

// deno-lint-ignore no-explicit-any
const zReadFile = <T,>(path: string, zSchema: z.ZodType<T, any, any>) =>
	Deno.readTextFile(path)
		.then(JSON.parse)
		.then(zSchema.parse.bind(zSchema))

export const fetchCategory = (id: string) => zReadFile(`../logs/emi/categories/${id}.json`, zCategory)

export const fetchStacks = () => zReadFile("../logs/emi/stacks.json", zStacksFile)

export const fetchAll = () =>
	Promise.all([
		Promise.all(
			Deno
				.readDirSync("../logs/emi/categories/")
				.filter((entry) => entry.isFile)
				.map((file) => parse(file.name).name)
				.map(fetchCategory),
		),
		fetchStacks(),
	])
		.then(([categories, stacks]) => ({
			categories,
			stacks,
		}))

if (import.meta.main) {
	// When run, this file verifies the dump against the schema
	await fetchAll()
}
