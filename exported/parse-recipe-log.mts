import { ZodError } from "https://deno.land/x/zod@v3.24.2/mod.ts"
import { Recipe, zRecipe } from "./schema-recipe.mts"

const locate = (relative: string) => import.meta.resolve(relative).slice("file://".length)

export type RequiredSome<T, K extends keyof T> = {
	[P in keyof T]: P extends K ? NonNullable<T[P]> : T[P]
}

export const parsed = Deno.readTextFileSync(locate("../logs/kubejs/server.log"))
	.split("\n")
	.values()
	.map((line) => {
		let match = line.match(/export_recipes\.js#\d+: (?<recipe>.*}) .*?$/)?.groups?.recipe
		if (!match) return null
		match = match.replaceAll(/([:a-zA-Z_]+?)=/g, (_, k) => `"${k}":`)
		try {
			return JSON.parse(match)
		} catch (e) {
			console.error(line)
			throw e
		}
	})
	.filter((recipe) => recipe !== null)
	.filter((recipe) => {
		const { success, error, data } = zRecipe.safeParse(recipe)
		if (!success) {
			const [{ unionErrors }] = error.errors as unknown as [{ unionErrors: ZodError[] }]
			console.error(
				unionErrors?.filter(
					(e) => e.issues.every((i) => i.path[0] !== "type"),
				).map((e) => e.issues) ?? error,
			)
			console.error("Recipe:", recipe)
			Deno.exit()
		}
		return data?.type !== null
	}) as Iterable<RequiredSome<Recipe, "type">>

if (import.meta.main) {
	Deno.writeTextFileSync(
		locate("./recipes.json"),
		JSON.stringify(Array.from(parsed)),
		{ append: false },
	)
}
