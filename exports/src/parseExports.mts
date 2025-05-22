import { fromFileUrl } from "fromFileUrl"
import { zRecipe } from "./schema/recipe.mts"
import { RegExpUnion } from "./regex/RegExpUnion.ts"

const log = await Promise.resolve(
	import.meta.resolve("../../logs/kubejs/server.log"),
)
	.then(fromFileUrl)
	.then(Deno.readTextFile)
	.then((str) => str.trim())
	.catch((e) => {
		console.error("Cannot read server.log. Does it exist?")
		throw e
	})

const recipeIdBlacklist = RegExpUnion(
	/^gtceu:alloy_smelter\/alloy_smelt_netherite_scrap_to_nugget$/,
	/^gtceu:implosion_compressor\/implosion_star_tnt$/,
	/^sophisticatedstorage:[a-z]+_to_netherite_tier_upgrade$/,
	/^sophisticatedstorage:storage_[a-z]+$/,
	/^sophisticatedstorage:shulker_from_chest$/,
	/^sophisticatedstorage:flat_top_barrel_toggle$/,
	/^sophisticatedbackpacks:backpack_dye$/,
	/^hangglider:reinforced_hang_glider$/,
	/^minecraft:kjs\/gtceu_sticky_resin$/,
	/^minecraft:kjs\/ad_astra_[a-z_]+block$/,
)

export const recipes = new Map(
	log
		.matchAll(/\[INFO\] export_all_recipes\.js#\d+: \[RECIPE\] (?<id>.+)\t(?<json>.+)$/gm)
		.filter((m) => m.groups !== undefined)
		.map((m) => m.groups as { id: string, json: string })
		.map((d) => [d.id, d.json]),
)
	.entries()
	.map((e) => ({ id: e[0], jso: JSON.parse(e[1]) }))
	.filter(({ id, jso }) => Object.keys(jso).length > 1 && !recipeIdBlacklist.test(id))
	.map((groups) => Object.assign(groups.jso, { id: groups.id }))
	.map((jso) => zRecipe.parse(jso))
