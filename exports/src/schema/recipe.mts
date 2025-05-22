import { z } from "zod"
import {
	zCraftingShaped,
	zDimension,
	zForgeCombination,
	zIdentifier,
	zItemIngredient,
	zoIdentifier,
	zoItem,
	zoItemIngredient,
	zoRecipeBookCategory,
	zoRecipeBookGroup,
	zoRecipeConditions,
	zoTag,
	zStack,
} from "./mc.mts"
import { zGTCEURecipe, zoGTCEURecipeConditionsCleanroom, zoGTCEURecipeConditionsDimension, zoGTCEURecipeConditionsResearch } from "./gtceu.mts"
import { RegExpUnion } from "../regex/RegExpUnion.ts"

const zRecipeInternal = z
	.discriminatedUnion("type", [
		zGTCEURecipe.extend({
			type: z.enum([
				"gtceu:arc_furnace",
				"gtceu:atomic_reconstruction",
				"gtceu:macerator",
				"gtceu:packer",
				"gtceu:large_boiler",
				"gtceu:extruder",
				"gtceu:electrolyzer",
				"gtceu:ore_washer",
				"gtceu:bender",
				"gtceu:steam_boiler",
				"gtceu:extractor",
				"gtceu:compressor",
				"gtceu:alloy_smelter",
				"gtceu:implosion_compressor",
				"gtceu:thermal_centrifuge",
				"gtceu:fluid_solidifier",
				"gtceu:plasma_generator",
				"gtceu:sifter",
				"gtceu:forge_hammer",
				"gtceu:polarizer",
				"gtceu:lathe",
				"gtceu:vacuum_freezer",
				"gtceu:wiremill",
				"gtceu:coke_oven",
				"gtceu:cracker",
				"gtceu:canner",
				"gtceu:primitive_blast_furnace",
				"gtceu:electromagnetic_separator",
				"gtceu:pyrolyse_oven",
				"gtceu:gas_turbine",
				"gtceu:combustion_generator",
				"gtceu:evaporation",
				"gtceu:steam_turbine",
				"gtceu:fermenter",
				"gtceu:naquadah_reactor",
				"gtceu:large_naquadah_reactor",
				"gtceu:omnic_forge",
				"gtceu:quintessence_infuser",
				"gtceu:discharger",
				"gtceu:charger",
				"gtceu:naquadah_refinery",
				"gtceu:greenhouse",
				"gtceu:universal_crystallizer",
			]),
		}),
		zGTCEURecipe.extend(zoGTCEURecipeConditionsCleanroom.shape).extend({
			type: z.enum([
				"gtceu:cutter",
				"gtceu:laser_engraver",
				"gtceu:large_chemical_reactor",
				"gtceu:assembler",
				"gtceu:centrifuge",
				"gtceu:chemical_reactor",
				"gtceu:mixer",
				"gtceu:autoclave",
				"gtceu:brewery",
				"gtceu:distillery",
				"gtceu:fluid_heater",
				"gtceu:forming_press",
				"gtceu:chemical_bath",
			]),
		}),
		zGTCEURecipe.extend({
			type: z.enum([
				"gtceu:rock_breaker",
				"gtceu:rock_cycle_simulator",
			]),
			data: z.strictObject({
				fluidA: zIdentifier,
				fluidB: zIdentifier,
			}).optional(),
			recipeConditions: z.tuple([
				z.strictObject({
					type: z.literal("rock_breaker"),
				}),
			]).optional()
				.or(zoGTCEURecipeConditionsDimension.shape.recipeConditions),
		}),
		zGTCEURecipe.extend({
			type: z.literal("gtceu:fusion_reactor"),
			data: z.strictObject({
				eu_to_start: z.number().int().min(40000000).max(640000000),
			}),
		}),
		zGTCEURecipe.extend({
			type: z.literal("gtceu:air_scrubber"),
			recipeConditions: z.tuple([
				z.strictObject({
					type: z.literal("environmental_hazard"),
					condition: z.literal("carbon_monoxide_poisoning"),
				}),
			]),
		}),
		zGTCEURecipe.extend(zoGTCEURecipeConditionsCleanroom.shape).extend({
			type: z.literal("gtceu:circuit_assembler"),
			data: z.strictObject({
				solder_multiplier: z.number().int().min(2).max(4),
			}).optional(),
		}),
		zGTCEURecipe.extend({
			type: z.literal("gtceu:scanner"),
			data: z.strictObject({
				scan_for_research: z.literal(1),
			}),
		}),
		zGTCEURecipe.extend({
			type: z.enum([
				"gtceu:research_station",
				"gtceu:subatomic_digital_assembly",
			]),
			data: z.strictObject({
				duration_is_total_cwu: z.literal(1),
				hide_duration: z.literal(1),
			}),
		}),
		zGTCEURecipe.extend({
			type: z.enum([
				"gtceu:electric_blast_furnace",
				"gtceu:alloy_blast_smelter",
			]),
			data: z.strictObject({
				ebf_temp: z.number().int().min(307).max(12500),
			}),
		}),
		zGTCEURecipe.extend(zoGTCEURecipeConditionsResearch.shape).extend({
			type: z.literal("gtceu:assembly_line"),
		}),
		zGTCEURecipe
			.extend(zoGTCEURecipeConditionsCleanroom.shape)
			.extend({
				type: z.literal("gtceu:distillation_tower"),
				data: z.strictObject({
					disable_distillery: z.literal(1),
				}).optional(),
			}),
		zGTCEURecipe.extend(zoGTCEURecipeConditionsDimension.shape).extend({
			type: z.literal("gtceu:gas_collector"),
		}),
		zGTCEURecipe.extend({
			type: z.literal("gtceu:microverse"),
			data: z.strictObject({
				projector_tier: z.number().int().min(1).max(4),
			}),
		}),

		zoIdentifier
			.extend(zoItemIngredient.shape)
			.extend(zoRecipeConditions.shape)
			.extend({
				type: z.literal("minecraft:stonecutting"),
				count: z.number().int().min(1),
				result: zIdentifier,
			}),
		zoIdentifier
			.extend(zCraftingShaped(3).shape)
			.extend(zoRecipeConditions.shape)
			.extend(zoRecipeBookCategory.shape)
			.extend(zoRecipeBookGroup.shape)
			.extend({
				type: z.enum([
					"minecraft:crafting_shaped",
					"gtceu:crafting_shaped_strict",
					"sophisticatedcore:upgrade_next_tier",
					"gtceu:crafting_shaped_fluid_container",
					"gtceu:tools",
					"gtceu:shaped",
				]),
				show_notification: z.literal(true).optional(),
				"kubejs:mirror": z.literal(false).optional(),
				"kubejs:shrink": z.literal(false).optional(),
			}),
		zoIdentifier
			.extend(zCraftingShaped(11).shape)
			.extend({
				type: z.literal("extendedcrafting:shaped_table"),
			}),
		zoIdentifier.extend(zCraftingShaped(3).shape).extend({
			type: z.literal("gtceu:crafting_shaped_energy_transfer"),
			overrideCharge: z.boolean(),
			transferMaxCharge: z.literal(true),
			chargeIngredient: zItemIngredient,
		}),
		zoIdentifier
			.extend(zoRecipeBookCategory.shape)
			.extend(zoRecipeBookGroup.shape)
			.extend(zoRecipeConditions.shape)
			.extend({
				type: z.enum([
					"minecraft:smelting",
					"minecraft:blasting",
					"minecraft:campfire_cooking",
					"minecraft:smoking",
					"gtceu:smelting",
					"gtceu:blasting",
				]),
				result: zItemIngredient,
				ingredient: zItemIngredient.or(zForgeCombination(zItemIngredient)),
				experience: z.number().min(0).max(2),
				cookingtime: z.number().int().min(50).max(600),
			}),
		zoIdentifier
			.extend(zoRecipeConditions.shape)
			.extend(zoRecipeBookCategory.shape)
			.extend(zoRecipeBookGroup.shape)
			.extend({
				type: z.enum([
					"minecraft:crafting_shapeless",
					"extendedcrafting:shapeless_table",
				]),
				ingredients: zItemIngredient.array().nonempty().optional(),
				show_notification: z.literal(true).optional(),
				result: zItemIngredient,
				// kubejs version
				ingredient: zItemIngredient.optional(),
				count: z.literal(1).optional(),
			}),
		zoIdentifier.extend({
			type: z.literal("ad_astra:nasa_workbench"),
			ingredients: zItemIngredient.array().nonempty(),
			result: z.strictObject({
				count: z.literal(1),
				id: zIdentifier,
			}),
		}),
		zoIdentifier.extend({
			type: z.literal("minecraft:smithing_trim"),
			base: zItemIngredient,
			addition: zItemIngredient,
			template: zItemIngredient,
		}),
		zoIdentifier.extend({
			type: z.literal("functionalstorage:custom_compacting"),
			higher_input: zStack,
			lower_input: zStack,
		}),
		zoIdentifier
			.extend(zoItemIngredient.partial().shape)
			.extend(zoRecipeConditions.shape)
			.extend({
				type: z.literal("thermal:insolator"),
				energy_mod: z.number().min(0.5).max(6).default(1),
				water_mod: z.number().min(0.5).max(6).default(1),
				result: zoItem.extend({
					chance: z.number().min(0.05).max(6),
				}).array().nonempty().optional(),
				experience: z.number().min(0.15).max(0.25).optional(),

				// kubejs version
				ingredients: z.tuple([zoItem]).optional(),
				results: zoItem.extend({
					chance: z.number().min(0.05).max(6),
					count: z.literal(1),
				}).array().nonempty().optional(),
			}),
		zoIdentifier.extend({
			type: z.literal("enderio:soul_binding"),
			energy: z.number().int().min(51200).max(288000),
			exp: z.number().int().min(4).max(8),
			entity_type: zIdentifier.optional(),
			input: zItemIngredient,
			output: zItemIngredient,
			souldata: z.literal("engine").optional(),
		}),
		zoIdentifier.extend({
			type: z.literal("enderio:tank"),
			fluid: z.strictObject({
				fluid: zIdentifier,
				amount: z.number().int().min(250).max(1000),
			}),
			input: zItemIngredient,
			is_emptying: z.boolean(),
			output: zStack,
		}),
		zoIdentifier.extend({
			type: z.literal("ae2:charger"),
			ingredient: zoItem,
			result: zoItem,
		}),
		zoIdentifier.extend({
			type: z.literal("ae2:inscriber"),
			mode: z.enum(["inscribe", "press"]),
			ingredients: z.strictObject({
				top: zoItem.optional(),
				middle: zoTag.or(zoItem),
				bottom: zoItem.optional(),
			}),
			result: zStack,
		}),
		zoIdentifier
			.extend(zoItemIngredient.shape)
			.extend({
				type: z.literal("thermal:numismatic_fuel"),
				energy: z.number().int().min(0),
			}),
		zoIdentifier.extend({
			type: z.literal("thermal:numismatic_fuel_kjs"),
			energy: z.number().int().min(0),
			ingredients: z.tuple([zItemIngredient]),
		}),
		zoIdentifier.extend({
			type: z.literal("enderio:fire_crafting"),
			dimensions: z.tuple([zDimension]),
			loot_table: z.literal("enderio:fire_crafting/infinity"),
			max_item_drops: z.literal(1),
			base_blocks: z.tuple([
				z.strictObject({
					block: zIdentifier,
				}),
			]),
		}),
		zoIdentifier.extend({
			type: z.literal("enderio:slicing"),
			energy: z.literal(20000),
			output: zoItem,
			inputs: zoItem.or(zoTag).array(),
		}),
		zoIdentifier.extend({
			type: z.literal("nuclearcraft:fission_reactor_controller"),
			input: z.tuple([zoItem]),
			output: z.tuple([zoItem]),
			powerModifier: z.literal(1),
			radiation: z.literal(1),
			timeModifier: z.literal(1),
		}),
		zoIdentifier.extend({
			type: z.literal("extendedcrafting:combination"),
			input: zoItem,
			result: zStack,
			ingredients: zItemIngredient.array().nonempty(),
			powerCost: z.literal(4000000),
			powerRate: z.literal(400000),
		}),
		zoIdentifier
			.extend(zCraftingShaped(3).shape)
			.extend({
				type: z.literal("extendedcrafting:sculk_charging"),
				result: zStack,
				powerRequired: z.literal(200000000),
				powerRate: z.literal(200000000),
			}),
		z.object({
			type: z.enum([
				"framedblocks:frame",
				"chiselsandbits:modification_table",
				"almostunified:client_recipe_tracker",
				"constructionwand:wand_upgrade",
				"ironfurnaces:generator_blasting",
				"quark:slab_to_block",
				"patchouli:shaped_book_recipe",
				"waystones:warp_plate",
				"framing_templates:template_copy",

				"gtceu:crafting_tool_head_replace",
				"gtceu:crafting_facade_cover",
				"gtceu:redstone_servo",
				"gtceu:solar_panel_basic_conversion",
				"gtceu:solar_panel_basic_reversion",

				"systeams:steam",
				"systeams:boiling",
				"systeams:upgrade_shapeless",

				"ae2wtlib:upgrade",
				"ae2wtlib:combine",
				"ae2:matter_cannon",
				"ae2:transform",
				"ae2:entropy",

				"sophisticatedstorage:shulker_box_from_vanilla_shapeless",
				"sophisticatedstorage:barrel_material",
				"sophisticatedstorage:generic_wood_storage",
				"sophisticatedstorage:storage_tier_upgrade",
				"sophisticatedbackpacks:backpack_upgrade",

				"chipped:mason_table",
				"chipped:botanist_workbench",
				"chipped:glassblower",
				"chipped:carpenters_table",
				"chipped:tinkering_table",
				"chipped:loom_table",
				"chipped:alchemy_bench",

				"ad_astra:alloying",
				"ad_astra:refining",
				"ad_astra:cryo_freezing",
				"ad_astra:compressing",
				"ad_astra:oxygen_loading",
				"ad_astra:space_station_recipe",

				"minecraft:crafting_special_mapextending",
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
				"minecraft:smithing_transform",
				"minecraft:crafting_decorated_pot",

				"thermal:tree_extractor",
				"thermal:press",
				"thermal:bottler",
				"thermal:centrifuge",
				"thermal:gourmand_fuel",
				"thermal:pulverizer",
				"thermal:pulverizer_recycle",
				"thermal:stirling_fuel",
				"thermal:tree_extractor_boost",
				"thermal:lapidary_fuel",
				"thermal:fisher_boost",
				"thermal:smelter",
				"thermal:insolator_catalyst",
				"thermal:crystallizer",
				"thermal:smelter_catalyst",
				"thermal:compression_fuel",
				"thermal:refinery",
				"thermal:sawmill",
				"thermal:crucible",
				"thermal:potion_diffuser_boost",
				"thermal:smelter_recycle",
				"thermal:pyrolyzer",
				"thermal:furnace",
				"thermal:pulverizer_catalyst",
				"thermal:chiller",
				"thermal:rock_gen",
				"thermal:magmatic_fuel",
				"thermal:disenchantment_fuel",

				"enderio:alloy_smelting",
				"enderio:enchanting",
				"enderio:sag_milling",
				"enderio:grinding_ball",

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
				"nuclearcraft:reset_nbt",
				"nuclearcraft:supercooler",
				"nuclearcraft:assembler",
				"nuclearcraft:irradiator",
				"nuclearcraft:analyzer",
				"nuclearcraft:fluid_infuser",
				"nuclearcraft:electrolyzer",
				"nuclearcraft:rock_crusher",
				"nuclearcraft:fluid_enricher",
				"nuclearcraft:steam_turbine",
				"nuclearcraft:gas_scrubber",
				"nuclearcraft:turbine_controller",
				"nuclearcraft:fission_boiling",
				"nuclearcraft:alloy_smelter",
				"nuclearcraft:extractor",
			]),
		}),
	])
	.catch((ctx) => {
		console.error(
			ctx.input,
			ctx.error.issues.map((i) =>
				({
					code: i.code,
					message: i.message,
					path: i.path.join("."),
					input: i.path.reduce(Reflect.get, ctx.input),
					jsonInput: JSON.stringify(i.path.reduce(Reflect.get, ctx.input)),
				}) as object
			).concat([{
				type: ctx.input.type,
				id: "id" in ctx.input ? ctx.input.id : null,
			}]),
		)
		throw null
	})

const zRecipeIDtoRecipeType = z.union([
	z.string().regex(
		/^kubejs:(arc_furnace|atomic_reconstruction|macerator|packer|large_boiler|extruder|forming_press|electrolyzer|ore_washer|bender|steam_boiler|extractor|compressor|alloy_smelter|implosion_compressor|thermal_centrifuge|fluid_solidifier|plasma_generator|sifter|forge_hammer|polarizer|chemical_bath|lathe|vacuum_freezer|wiremill|coke_oven|cracker|canner|primitive_blast_furnace|electromagnetic_separator|pyrolyse_oven|gas_turbine|combustion_generator|evaporation|steam_turbine|fermenter|cutter|laser_engraver|large_chemical_reactor|assembler|centrifuge|chemical_reactor|mixer|autoclave|brewery|distillery|fluid_heater|rock_breaker|fusion_reactor|air_scrubber|circuit_assembler|scanner|research_station|electric_blast_furnace|alloy_blast_smelter|assembly_line|distillation_tower|gas_collector|[a-z_]*naquadah_reactor|subatomic_digital_assembly|rock_cycle_simulator|discharger|charger|omnic_forge|greenhouse|microverse|combustion_generator)/,
	).transform((id) => id.replace("kubejs", "gtceu")),
	z.string().startsWith("gtceu:"),
	z.literal("ae2:wiremill").transform(() => "gtceu:wiremill"),
	z.string().startsWith("ae2:"),
	z.union([
		z.string().startsWith("travellersbootsreloaded:travellers_boots"),
		z.string().startsWith("kubejs:phytogro"),
		z.enum(["kubejs:epp", "kubejs:ae2_terminal", "kubejs:shapeless"]),
	]).transform(() => "minecraft:crafting_shapeless"),
	z.enum([
		"extendedcrafting:kjs",
		"ad_astra:nasa_workbench",
		"kubejs:soul_binder",
		"kubejs:microminer",
		"kubejs:extended",
	]).transform(() => "extendedcrafting:shaped_table"),
	z.union([
		z.enum([
			"minecraft:kjs",
			"minecraft:shaped",
			"thermal:augments",
			"thermal:machine_insolator",
			"thermal:device_fisher",
			"ad_astra:assembler",
			"minecraft:elite_table_dupe",
			"minecraft:ultimate_table_dupe",
			"minecraft:epic_table_dupe",
			"enderio:crafter",
		]),
		z.string().startsWith("functionalstorage:"),
		z.string().startsWith("moni:"),
		z.string().startsWith("kubejs:"),
	]).transform(() => "minecraft:crafting_shaped"),
	z.literal("thermal:kjs").transform(() => "thermal:insolator"),
	z.literal("travellersbootsreloaded:atomic_reconstruction").transform(() => "gtceu:atomic_reconstruction"),
	z.literal("enderio:quintessence_infuser").transform(() => "gtceu:quintessence_infuser"),
	z.literal("thermal:assembler").transform(() => "gtceu:assembler"),
	z.string().regex(/thermal:press_.+_die/),
])

const forcedShapeless = RegExpUnion(
	/^expatternprovider:tape$/,
	/^kubejs:ae2\/(memory_card|(energy_)?level_emitter|storage_bus)$/,
	/^kubejs:[a-z_]+_legacy_updater$/,
	/^kubejs:(conductive_alloy_dust_handcraft|ender_pearl|cocoa_beans|smore_\d+)$/,
	/^minecraft:kjs\/moni_nickel$/,
	/^minecraft:kjs\/moni_quarter_2$/,
	/^minecraft:kjs\/ae2_crafting_card$/,
	/^minecraft:kjs\/m?ae2_[a-z_]+_p2p_tunnel$/,
	/^minecraft:kjs\/betterp2p_advanced_memory_card$/,
	/^minecraft:kjs\/nuclearcraft_fission_reactor_port$/,
	/^minecraft:kjs\/enderio_(pressurized_)?fluid_tank$/,
	/^minecraft:kjs\/enderio_grains_of_infinity$/,
	/^minecraft:kjs\/[a-z_]*sand[a-z_0-9]*$/,
	/^minecraft:kjs\/(compressed_)?infinity_dust_block_2$/,
	/^minecraft:kjs\/(slime_ball|blaze_rod|ender_spore|ender_pearl|pulsating_dust(_\d+)?|clay(_ball)?|gravel|dust)$/,
	/^minecraft:kjs\/gtceu_(neutronium_nugget|battery_alloy_dust|molybdenum_ingot)$/,
	/^minecraft:kjs\/solidified_[a-z]+$/,
	/^minecraft:kjs\/dense_[a-z]+_2$/,
	/^minecraft:kjs\/chisel_chipped_integration_[a-z_0-9]+$/,
	/^minecraft:kjs\/gtceu_[a-z_]+_hazard_sign_block$/,
	/^minecraft:kjs\/gtceu_solid_machine_casing(_\d+)?$/,
	/^minecraft:kjs\/gtceu_[a-z_]*marble[a-z_0-9]*$/,
	/^moni:lv_[a-z]+_battery$/,
)

const forcedShaped = RegExpUnion(
	/^kubejs:shapeless\/microverse_casing$/,
	/^minecraft:kjs\/(double_)?compressed(_red)?_sand$/,
)

const forcedExtendedCrafting = new Set([
	"kubejs:shaped/subatomic_digital_assembler",
	"kubejs:shaped/quintessence_infuser",
	"kubejs:shaped/hyperbolic_microverse_projector",
	"gtceu:shaped/atmospheric_accumulator",
	"gtceu:shaped/matter_alterator",
])

export const zRecipe = z
	.object({
		type: zIdentifier.or(z.null()),
		id: zIdentifier,
	})
	.passthrough()
	.refine((recipe) => recipe.type ??= zRecipeIDtoRecipeType.parse(recipe.id.split("/", 1)[0]))
	.refine((recipe) => {
		if (forcedShapeless.test(recipe.id)) recipe.type = "minecraft:crafting_shapeless"
		if (recipe.id.startsWith("thermal:kjs/elmz0havrfy39lpkztirwnlib"))
			recipe.type = "thermal:numismatic_fuel_kjs"
		if (recipe.id.startsWith("ad_astra:assembler"))
			recipe.type = "gtceu:assembler"
		if (recipe.id.startsWith("extendedcrafting:kjs/elmz0havrfy39lpkztirwnlib_")) {
			const n = Number(recipe.id.split("_", 2)[1])
			if (n >= 9 && n <= 14) return recipe.type = "extendedcrafting:combination"
			if (n === 17) return recipe.type = "extendedcrafting:sculk_charging"
		}
		if (forcedExtendedCrafting.has(recipe.id)) recipe.type = "extendedcrafting:shaped_table"
		if (forcedShaped.test(recipe.id)) recipe.type = "minecraft:crafting_shaped"
		if (recipe.type === "extendedcrafting:shaped_table" && "ingredients" in recipe)
			recipe.type = "extendedcrafting:shapeless_table"
		return true
	})
	.pipe(zRecipeInternal)

export type Recipe = z.infer<typeof zRecipe>
