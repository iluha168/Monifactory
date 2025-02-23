import { z, ZodType } from "https://deno.land/x/zod@v3.24.2/mod.ts"

export const zIdentifier = z.string().regex(/^([a-z0-9_]+:)?[a-z0-9_]+/)
export const zIdentifierObj = z.strictObject({
	id: zIdentifier,
})
export const zTag = z.string().regex(/^([a-z0-9_]+:)?[a-z0-9_]+(\/[a-z0-9_]+)?/)

export const zItemObj = z.strictObject({ item: zIdentifier })
export const zTagObj = z.strictObject({ tag: zTag })
export const zItemOrTagObj = zItemObj.or(zTagObj)

export const zItemNBTObj = zItemObj.extend({
	nbt: z.object({}).or(z.string()).optional(),
})

export const zAmountObj = z.strictObject({
	amount: z.number().int().min(1),
})
export const zFluidObj = z.strictObject({ fluid: zIdentifier })
export const zFluidTagObjAmount = zTagObj.merge(zAmountObj)
export const zFluidObjAmount = zFluidObj.merge(zAmountObj)

export const zCount = z.number().int().min(1)
export const zCountObj = z.strictObject({
	count: zCount.optional(),
})
export const zItemObjCount = zItemObj.merge(zCountObj)
export const zTagObjCount = zTagObj.merge(zCountObj)
export const zItemOrTagObjCount = zItemObjCount.or(zTagObjCount)

export const zWaterframesFix = <T extends z.ZodObject<{ item: z.ZodString }>>(obj: T) =>
	obj
		.extend({
			id: zIdentifier.optional(),
		})
		.refine((o) => !o.id || o.id === o.item)
		.transform((o) => {
			delete o.id
		})

export type ForgeCombination<T> =
	| T
	| {
		type: "forge:intersection"
		children: [ForgeCombination<T>, ForgeCombination<T>, ...ForgeCombination<T>[]]
	}
	| {
		type: "forge:and" | "forge:or"
		values: [ForgeCombination<T>, ...ForgeCombination<T>[]]
	}
	| {
		type: "forge:not"
		value: ForgeCombination<T>
	}
	| ({
		type: "forge:nbt"
		nbt: string
	} & z.infer<typeof zItemObjCount>)
	| {
		type: "forge:difference"
		base: ForgeCombination<T>
		subtracted: ForgeCombination<T>
	}

export function zForgeCombination<T extends ZodType>(of: T, deep = 3) {
	if (!deep) return z.never()
	const baseCombination = z.discriminatedUnion("type", [
		z.strictObject({
			type: z.literal("forge:intersection"),
			children: of.array().min(2),
		}),
		z.strictObject({
			type: z.enum(["forge:and", "forge:or"]),
			values: of.array().nonempty(),
		}),
		z.strictObject({
			type: z.literal("forge:not"),
			value: of,
		}),
		zItemObjCount.extend({
			type: z.literal("forge:nbt"),
			nbt: z.string(),
		}),
		z.strictObject({
			type: z.literal("forge:difference"),
			base: of,
			subtracted: of,
		}),
	]).or(of)
	const combination = baseCombination.or(
		z.lazy(() => zForgeCombination(baseCombination, deep - 1)),
	) as unknown as z.ZodType<ForgeCombination<T>>
	return combination
}

export const zMaybeArray = <T extends ZodType>(of: T) => of.or(of.array().nonempty())

export const zIngredientObj = z.strictObject({
	ingredient: zMaybeArray(
		zMaybeArray(zItemOrTagObj).or(zForgeCombination(zItemOrTagObjCount)),
	),
	count: zCount,
})

export const zEXP = z.strictObject({
	experience: z.number().nonnegative().optional(),
})

export const zCraftingPattern = z.string().min(1).array().min(1)
export const zCraftingKeyMap = z.record(
	z.string().length(1),
	z.union([
		zMaybeArray(zItemOrTagObj),
		z.strictObject({
			type: z.literal("forge:nbt"),
			item: zIdentifier,
			count: z.literal(1),
			nbt: z.string(),
		}),
		z.strictObject({
			type: z.literal("gtceu:fluid_container"),
			fluid: zAmountObj.extend({
				value: z.tuple([zTagObj]),
			}),
		}),
	]),
)
export const zCraftingCategory = zIdentifier
export const zCraftingGroup = zIdentifier
export const zCraftingCondition = z.discriminatedUnion("type", [
	z.strictObject({
		type: z.literal("quark:flag"),
		flag: zIdentifier,
	}),
	z.strictObject({
		type: z.literal("forge:mod_loaded"),
		modid: zIdentifier,
	}),
	z.strictObject({
		type: z.literal("forge:item_exists"),
		item: zIdentifier,
	}),
	z.strictObject({
		type: z.literal("thermal:flag"),
		flag: zIdentifier,
	}),
	z.strictObject({
		type: z.literal("sophisticatedcore:item_enabled"),
		itemRegistryName: zIdentifier,
	}),
	z.strictObject({
		type: z.literal("cucumber:feature_flag"),
		flag: zIdentifier,
	}),
])
export const zCraftingConditions = z.strictObject({
	conditions: zForgeCombination(zCraftingCondition).array().optional(),
})

export const zDimension = z.enum([
	"minecraft:overworld",
	"minecraft:the_nether",
	"minecraft:the_end",
])

export const zAEInWorldMatter = z.union([
	z.strictObject({ block: zIdentifierObj }),
	z.strictObject({ fluid: zIdentifierObj }),
	z.strictObject({ drops: z.tuple([zItemObj]) }),
])

export const zGTRecipeIngredientItem = z.union([
	zIngredientObj.merge(zCountObj).extend({
		type: z.literal("gtceu:sized"),
	}),
	z.strictObject({
		type: z.literal("gtceu:circuit"),
		configuration: z.number().int().min(1).max(24),
	}),
	zForgeCombination(zTagObj),
])
export const zGTRecipeIngredientFluid = zAmountObj.extend({
	value: z.tuple([zTagObj.or(zFluidObj)]),
})

export const zGTChanced = <T extends ZodType>(of: T) =>
	z.strictObject({
		chance: z.number().int().min(0).max(10000),
		maxChance: z.number().int().min(0).max(10000),
		tierChanceBoost: z.number().int().min(0),
		content: of,
	})

export const zGTRecipeIOTick = z.strictObject({
	cwu: zGTChanced(z.number().int().min(1)).array().nonempty().optional(),
	eu: zGTChanced(z.number().int().min(1)).array().nonempty().optional(),
})
export const zGTRecipeIO = z.strictObject({
	item: zGTChanced(
		zGTRecipeIngredientItem.or(z.strictObject({
			// Because of that one broken alloy smelter recipe
			type: z.literal("gtceu:sized"),
			count: z.literal(0),
			ingredient: z.tuple([]),
		})),
	).array().optional(),
	fluid: zGTChanced(zGTRecipeIngredientFluid).array().optional(),
})

export const zGTRecipeCondition = z.discriminatedUnion("type", [
	z.strictObject({
		type: z.literal("cleanroom"),
		cleanroom: z.enum(["cleanroom", "sterile_cleanroom"]),
	}),
	z.strictObject({
		type: z.literal("rock_breaker"),
	}),
	z.strictObject({
		type: z.literal("environmental_hazard"),
		condition: z.literal("carbon_monoxide_poisoning"),
	}),
	z.strictObject({
		type: z.literal("research"),
		research: z.tuple([
			z.strictObject({
				researchId: zIdentifier,
				dataItem: z.strictObject({
					id: z.enum(["gtceu:data_stick", "gtceu:data_orb", "gtceu:data_module"]),
					Count: z.literal(1),
					tag: z.object({}),
				}),
			}),
		]),
	}),
	z.strictObject({
		type: z.literal("dimension"),
		dimension: zDimension,
	}),
])

export const zGTDataCoilTemp = z.strictObject({
	data: z.strictObject({
		ebf_temp: z.number().int().nonnegative(),
	}),
})

export const zGTRecipe = <T extends string>(type: T) =>
	z.strictObject({
		duration: z.number().int().min(0),
		type: z.literal(type),

		inputs: zGTRecipeIO,
		outputs: zGTRecipeIO,

		tickInputs: zGTRecipeIOTick,
		tickOutputs: zGTRecipeIOTick,

		inputChanceLogics: z.strictObject({}),
		outputChanceLogics: z.strictObject({}),

		tickInputChanceLogics: z.strictObject({}),
		tickOutputChanceLogics: z.strictObject({}),

		recipeConditions: z.tuple([zGTRecipeCondition]).optional(),
	})

export const zRecipe = z.discriminatedUnion("type", [
	zGTRecipe("gtceu:alloy_blast_smelter/gtceu:alloy_blast_smelter").merge(zGTDataCoilTemp),
	zGTRecipe("gtceu:alloy_smelter/gtceu:alloy_smelter"),
	zGTRecipe("gtceu:alloy_smelter/gtceu:ingot_molding"),
	zGTRecipe("gtceu:autoclave/gtceu:autoclave"),
	zGTRecipe("gtceu:air_scrubber/gtceu:air_scrubber"),
	zGTRecipe("gtceu:arc_furnace/gtceu:arc_furnace"),
	zGTRecipe("gtceu:arc_furnace/gtceu:arc_furnace_recycling"),
	zGTRecipe("gtceu:assembler/gtceu:assembler"),
	zGTRecipe("gtceu:assembly_line/gtceu:assembly_line"),
	zGTRecipe("gtceu:brewery/gtceu:brewery"),
	zGTRecipe("gtceu:bender/gtceu:bender"),
	zGTRecipe("gtceu:canner/gtceu:canner"),
	zGTRecipe("gtceu:cutter/gtceu:cutter"),
	zGTRecipe("gtceu:chemical_reactor/gtceu:chemical_reactor"),
	zGTRecipe("gtceu:chemical_bath/gtceu:chem_dyes"),
	zGTRecipe("gtceu:chemical_bath/gtceu:ore_bathing"),
	zGTRecipe("gtceu:chemical_bath/gtceu:chemical_bath"),
	zGTRecipe("gtceu:compressor/gtceu:compressor"),
	zGTRecipe("gtceu:coke_oven/gtceu:coke_oven"),
	zGTRecipe("gtceu:centrifuge/gtceu:centrifuge"),
	zGTRecipe("gtceu:circuit_assembler/gtceu:circuit_assembler").extend({
		data: z.strictObject({
			solder_multiplier: z.number().int().min(2).max(4),
		}).optional(),
	}),
	zGTRecipe("gtceu:cracker/gtceu:cracker"),
	zGTRecipe("gtceu:combustion_generator/gtceu:combustion_generator"),
	zGTRecipe("gtceu:distillery/gtceu:distillery"),
	zGTRecipe("gtceu:distillation_tower/gtceu:distillation_tower").extend({
		data: z.strictObject({
			disable_distillery: z.literal(1),
		}).optional(),
	}),
	zGTRecipe("gtceu:extractor/gtceu:extractor"),
	zGTRecipe("gtceu:extractor/gtceu:extractor_recycling"),
	zGTRecipe("gtceu:extruder/gtceu:extruder"),
	zGTRecipe("gtceu:evaporation/gtceu:evaporation"),
	zGTRecipe("gtceu:electric_blast_furnace/gtceu:electric_blast_furnace").merge(zGTDataCoilTemp),
	zGTRecipe("gtceu:electromagnetic_separator/gtceu:electromagnetic_separator"),
	zGTRecipe("gtceu:electrolyzer/gtceu:electrolyzer"),
	zGTRecipe("gtceu:forge_hammer/gtceu:forge_hammer"),
	zGTRecipe("gtceu:forge_hammer/gtceu:ore_forging"),
	zGTRecipe("gtceu:forming_press/gtceu:forming_press"),
	zGTRecipe("gtceu:fermenter/gtceu:fermenter"),
	zGTRecipe("gtceu:fluid_solidifier/gtceu:fluid_solidifier"),
	zGTRecipe("gtceu:fluid_heater/gtceu:fluid_heater"),
	zGTRecipe("gtceu:fusion_reactor/gtceu:fusion_reactor").extend({
		data: z.strictObject({
			eu_to_start: z.number().int().nonnegative(),
		}),
	}),
	zGTRecipe("gtceu:gas_turbine/gtceu:gas_turbine"),
	zGTRecipe("gtceu:gas_collector/gtceu:gas_collector"),
	zGTRecipe("gtceu:implosion_compressor/gtceu:implosion_compressor"),
	zGTRecipe("gtceu:large_chemical_reactor/gtceu:large_chemical_reactor"),
	zGTRecipe("gtceu:large_boiler/gtceu:large_boiler"),
	zGTRecipe("gtceu:laser_engraver/gtceu:laser_engraver"),
	zGTRecipe("gtceu:lathe/gtceu:lathe"),
	zGTRecipe("gtceu:macerator/gtceu:macerator"),
	zGTRecipe("gtceu:macerator/gtceu:ore_crushing"),
	zGTRecipe("gtceu:macerator/gtceu:macerator_recycling"),
	zGTRecipe("gtceu:mixer/gtceu:mixer"),
	zGTRecipe("gtceu:ore_washer/gtceu:ore_washer"),
	zGTRecipe("gtceu:packer/gtceu:packer"),
	zGTRecipe("gtceu:plasma_generator/gtceu:plasma_generator"),
	zGTRecipe("gtceu:pyrolyse_oven/gtceu:pyrolyse_oven"),
	zGTRecipe("gtceu:primitive_blast_furnace/gtceu:primitive_blast_furnace"),
	zGTRecipe("gtceu:polarizer/gtceu:polarizer"),
	zGTRecipe("gtceu:rock_breaker/gtceu:rock_breaker").extend({
		data: z.strictObject({
			fluidA: zIdentifier,
			fluidB: zIdentifier,
		}),
	}),
	zGTRecipe("gtceu:research_station/gtceu:research_station").extend({
		data: z.strictObject({
			duration_is_total_cwu: z.literal(1),
			hide_duration: z.literal(1),
		}),
	}),
	zGTRecipe("gtceu:scanner/gtceu:scanner").extend({
		data: z.strictObject({
			scan_for_research: z.literal(1),
		}),
	}),
	zGTRecipe("gtceu:steam_boiler/gtceu:steam_boiler"),
	zGTRecipe("gtceu:steam_turbine/gtceu:steam_turbine"),
	zGTRecipe("gtceu:sifter/gtceu:sifter"),
	zGTRecipe("gtceu:thermal_centrifuge/gtceu:thermal_centrifuge"),
	zGTRecipe("gtceu:vacuum_freezer/gtceu:vacuum_freezer"),
	zGTRecipe("gtceu:wiremill/gtceu:wiremill"),
	zIngredientObj.merge(zCraftingConditions).extend({
		type: z.literal("minecraft:stonecutting"),
		result: zIdentifier,
	}),
	zCraftingConditions.extend({
		type: z.enum([
			"minecraft:crafting_shaped",
			"crafting_shaped",
			"gtceu:crafting_shaped_fluid_container",
			"endertanks:crafting",
			"enderchests:crafting",
			"sophisticatedstorage:shulker_box_from_chest",
		])
			.transform(() => "minecraft:crafting_shaped" as const),
		result: zWaterframesFix(zItemObjCount.merge(zItemNBTObj)),
		pattern: zCraftingPattern,
		key: zCraftingKeyMap,
		show_notification: z.literal(true).optional(),
		category: zCraftingCategory.optional(),
		group: zCraftingGroup.optional(),
	}),
	z.strictObject({
		type: z.literal("extendedcrafting:shaped_table"),
		result: zItemObjCount,
		pattern: zCraftingPattern,
		key: zCraftingKeyMap,
	}),
	zCraftingConditions.extend({
		type: z.literal("minecraft:crafting_shapeless"),
		result: zWaterframesFix(zItemObjCount.merge(zItemNBTObj)),
		ingredients: zIngredientObj.shape.ingredient,
		show_notification: z.literal(true).optional(),
		category: zCraftingCategory.optional(),
		group: zCraftingGroup.optional(),
	}),
	z.strictObject({
		type: z.literal("gtceu:crafting_shaped_energy_transfer"),
		result: zItemNBTObj,
		chargeIngredient: zItemObj,
		transferMaxCharge: z.boolean(),
		overrideCharge: z.boolean(),
		pattern: zCraftingPattern,
		key: zCraftingKeyMap,
	}),
	z.strictObject({
		type: z.literal("gtceu:crafting_shaped_strict"),
		result: zItemObjCount,
		pattern: zCraftingPattern,
		key: zCraftingKeyMap,
	}),
	zCraftingConditions.extend({
		type: z.literal("sophisticatedcore:upgrade_next_tier"),
		result: zItemObj,
		pattern: zCraftingPattern,
		key: zCraftingKeyMap,
	}),
	zEXP.merge(zCraftingConditions).extend({
		type: z.enum(["minecraft:blasting", "minecraft:smelting", "minecraft:smoking"]),
		result: zItemObjCount.or(zIdentifier),
		ingredient: zIngredientObj.shape.ingredient,
		cookingtime: z.number().int().min(100),
		category: zCraftingCategory.optional(),
		group: zCraftingGroup.optional(),
	}),
	z.strictObject({
		type: z.literal("minecraft:crafting_special_mapextending"),
		category: zCraftingCategory,
	}),
	zEXP.merge(zCraftingConditions).extend({
		type: z.literal("enderio:alloy_smelting"),
		is_smelting: z.literal(true).optional(),
		result: zItemObjCount,
		energy: z.number().positive(),
		inputs: zIngredientObj.array().nonempty(),
	}),
	zEXP.merge(zCraftingConditions).extend({
		type: z.literal("thermal:press"),
		energy: z.number().int().positive(),
		result: z.tuple([zItemObjCount.or(zFluidObjAmount)]),
		ingredients: zItemOrTagObjCount.array().nonempty(),
	}),
	zEXP.merge(zCraftingConditions).extend({
		type: z.literal("thermal:insolator"),
		energy_mod: z.number().nonnegative().optional(),
		water_mod: z.number().nonnegative().optional(),
		ingredient: zItemObj,
		result: zItemObj.extend({
			chance: z.number().positive(),
		}).array().nonempty(),
	}),
	z.strictObject({
		type: z.literal("thermal:insolator_catalyst"),
		ingredient: zItemObj,
		energy_mod: z.number().positive(),
		primary_mod: z.number().positive(),
		secondary_mod: z.number().positive(),
		min_chance: z.number().positive(),
		use_chance: z.number().positive(),
	}),
	z.strictObject({
		type: z.literal("thermal:lapidary_fuel"),
		ingredient: zTagObj,
		energy: z.number().int().positive(),
	}),
	z.strictObject({
		type: z.literal("thermal:rock_gen"),
		result: zItemObj,
		adjacent: zIdentifier,
	}),
	z.strictObject({
		type: z.literal("functionalstorage:custom_compacting"),
		higher_input: zItemObjCount,
		lower_input: zItemObjCount,
	}),
	z.strictObject({
		type: z.literal("enderio:soul_binding"),
		exp: z.number().int().positive(),
		energy: z.number().int().positive(),
		output: zItemObj,
		input: zItemOrTagObj,
		entity_type: zIdentifier.optional(),
		mob_category: zIdentifier.optional(),
		souldata: z.literal("engine").optional(),
	}),
	z.strictObject({
		type: z.literal("enderio:slicing"),
		energy: z.number().int().positive(),
		inputs: zItemOrTagObj.array().nonempty(),
		output: zItemObj,
	}),
	z.strictObject({
		type: z.literal("enderio:tank"),
		is_emptying: z.boolean(),
		output: zItemObj,
		input: zItemObj,
		fluid: zFluidObjAmount,
	}),
	z.strictObject({
		type: z.literal("enderio:fire_crafting"),
		max_item_drops: z.literal(1),
		loot_table: zTag,
		base_blocks: z.tuple([
			z.strictObject({
				block: zIdentifier,
			}),
		]),
		dimensions: z.tuple([zDimension]),
	}),
	z.strictObject({
		type: z.literal("nuclearcraft:supercooler"),
		radiation: z.literal(1),
		powerModifier: z.literal(1),
		timeModifier: z.literal(1),
		inputFluids: z.tuple([zFluidTagObjAmount]),
		outputFluids: z.tuple([zFluidTagObjAmount]),
	}),
	z.strictObject({
		type: z.literal("nuclearcraft:steam_turbine"),
		radiation: z.literal(1),
		powerModifier: z.number().min(1).max(1.1),
		timeModifier: z.number().min(0.1).max(0.2),
		inputFluids: z.tuple([zFluidTagObjAmount]),
		outputFluids: z.tuple([zFluidTagObjAmount]),
	}),
	z.strictObject({
		type: z.literal("nuclearcraft:turbine_controller"),
		radiation: z.literal(1),
		powerModifier: z.number().positive().max(1),
		timeModifier: z.literal(1),
		inputFluids: z.tuple([zFluidTagObjAmount]),
		outputFluids: z.tuple([zFluidTagObjAmount]),
	}),
	z.strictObject({
		type: z.literal("nuclearcraft:fission_reactor_controller"),
		radiation: z.literal(1),
		powerModifier: z.literal(1),
		timeModifier: z.literal(1),
		input: z.tuple([zItemObj]),
		output: z.tuple([zItemObj]),
	}),
	z.strictObject({
		type: z.literal("nuclearcraft:fission_boiling"),
		heatRequired: z.literal(1),
		inputFluids: z.tuple([zFluidTagObjAmount]),
		outputFluids: z.tuple([zFluidTagObjAmount]),
	}),
	z.strictObject({
		type: z.literal("ae2:charger"),
		result: zItemObj,
		ingredient: zItemObj,
	}),
	z.strictObject({
		type: z.literal("ae2:inscriber"),
		mode: z.literal("inscribe"),
		result: zItemObj,
		ingredients: z.strictObject({
			middle: zItemOrTagObj,
			top: zItemObj.optional(),
		}),
	}),
	z.strictObject({
		type: z.literal("ae2:transform"),
		result: zItemObjCount,
		ingredients: zItemOrTagObj.array().min(2),
		circumstance: z.strictObject({
			type: z.literal("explosion"),
		}),
	}),
	z.strictObject({
		type: z.literal("ae2:entropy"),
		mode: z.enum(["cool", "heat"]),
		output: zAEInWorldMatter,
		input: zAEInWorldMatter,
	}),
	// Ignored
	z.object({
		type: z.enum([
			"almostunified:client_recipe_tracker",
			"chiselsandbits:modification_table",
			"framedblocks:frame",
			"constructionwand:wand_upgrade",
			"ad_astra:cryo_freezing",
			"ironfurnaces:generator_blasting",
			"shetiphiancore:rgb16_colorize",
			"patchouli:shaped_book_recipe",
			"cofh_core:crafting_securable",
			"waystones:warp_plate",
			"functionalstorage:framed_recipe",
			"hangglider:copy_tag_shapeless_recipe",

			"gtceu:crafting_tool_head_replace/misc",
			"gtceu:crafting_facade_cover/misc",

			"framing_templates:template_decoration",
			"framing_templates:template_copy",

			"quark:slab_to_block",
			"quark:dye_item",

			"systeams:upgrade_shapeless",
			"systeams:steam",

			"sophisticatedcore:upgrade_clear",
			"sophisticatedstorage:shulker_box_from_vanilla_shapeless",
			"sophisticatedstorage:barrel_material",
			"sophisticatedstorage:storage_dye",
			"sophisticatedstorage:flat_top_barrel_toggle",
			"sophisticatedbackpacks:backpack_dye",

			"ae2:facade",
			"ae2:matter_cannon",
			"ae2wtlib:upgrade",
			"ae2wtlib:combine",

			"chipped:mason_table",
			"chipped:botanist_workbench",
			"chipped:glassblower",
			"chipped:carpenters_table",
			"chipped:tinkering_table",
			"chipped:loom_table",
			"chipped:alchemy_bench",

			"minecraft:campfire_cooking",
			"minecraft:smithing_trim",
			"minecraft:smithing_transform",
			"minecraft:crafting_decorated_pot",
			"minecraft:crafting_special_bookcloning",
			"minecraft:crafting_special_shielddecoration",
			"minecraft:crafting_special_shulkerboxcoloring",
			"minecraft:crafting_special_firework_star_fade",
			"minecraft:crafting_special_repairitem",
			"minecraft:crafting_special_tippedarrow",
			"minecraft:crafting_special_suspiciousstew",
			"minecraft:crafting_special_mapcloning",
			"minecraft:crafting_special_armordye",
			"minecraft:crafting_special_firework_rocket",
			"minecraft:crafting_special_firework_star",
			"minecraft:crafting_special_bannerduplicate",

			"thermal:tree_extractor",
			"thermal:crystallizer",
			"thermal:bottler",
			"thermal:pulverizer",
			"thermal:centrifuge",
			"thermal:gourmand_fuel",
			"thermal:stirling_fuel",
			"thermal:smelter_catalyst",
			"thermal:tree_extractor_boost",
			"thermal:smelter",
			"thermal:fisher_boost",
			"thermal:numismatic_fuel",
			"thermal:pulverizer_recycle",
			"thermal:compression_fuel",
			"thermal:refinery",
			"thermal:sawmill",
			"thermal:chiller",
			"thermal:crucible",
			"thermal:potion_diffuser_boost",
			"thermal:smelter_recycle",
			"thermal:pyrolyzer",
			"thermal:furnace",
			"thermal:pulverizer_catalyst",
			"thermal:magmatic_fuel",
			"thermal:disenchantment_fuel",

			"nuclearcraft:melter",
			"nuclearcraft:manufactory",
			"nuclearcraft:pump",
			"nuclearcraft:chemical_reactor",
			"nuclearcraft:centrifuge",
			"nuclearcraft:decay_hastener",
			"nuclearcraft:pressurizer",
			"nuclearcraft:crystallizer",
			"nuclearcraft:nc_ore_veins",
			"nuclearcraft:fuel_reprocessor",
			"nuclearcraft:isotope_separator",
			"nuclearcraft:leacher",
			"nuclearcraft:ingot_former",
			"nuclearcraft:fluid_infuser",
			"nuclearcraft:reset_nbt",
			"nuclearcraft:assembler",
			"nuclearcraft:irradiator",
			"nuclearcraft:analyzer",
			"nuclearcraft:electrolyzer",
			"nuclearcraft:rock_crusher",
			"nuclearcraft:fluid_enricher",
			"nuclearcraft:gas_scrubber",
			"nuclearcraft:alloy_smelter",
			"nuclearcraft:extractor",
			"nuclearcraft:shielding",

			"enderio:painting",
			"enderio:enchanting",
			"enderio:sag_milling",
			"enderio:grinding_ball",
			"enderio:dark_steel_upgrade",
		]).transform(() => null),
	}),
])

export type Recipe = z.infer<typeof zRecipe>
