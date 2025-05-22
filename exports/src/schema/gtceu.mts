import { z } from "zod"
import { zDimension, zFluidIngredient, zForgeCombination, zIdentifier, zItemIngredient, zoIdentifier, zoItem } from "./mc.mts"

const zGTCEUChanced = <T extends z.ZodType>(content: T) =>
	z.strictObject({
		chance: z.number().int().min(0),
		maxChance: z.number().int().min(9999).max(10000),
		tierChanceBoost: z.number().int().min(-10000).max(10000),
		content,
	})

const zGTCEUCircuit = z.strictObject({
	type: z.literal("gtceu:circuit"),
	configuration: z.number().int().min(1).max(25),
})

const zoGTCEUItemIngredient = z.strictObject({
	ingredient: z.union([
		zItemIngredient,
		zGTCEUCircuit,
	]),
})

export const zGTCEUIO = z.strictObject({
	item: zGTCEUChanced(z.discriminatedUnion("type", [
		zoGTCEUItemIngredient.extend({
			type: z.literal("gtceu:sized"),
			count: z.number().int().min(0).max(1000),
		}),
		zGTCEUCircuit,
		z.strictObject({
			type: z.literal("gtceu:int_provider"),
			ingredient: zoItem,
			count_provider: z.strictObject({
				type: z.literal("minecraft:uniform"),
				value: z.strictObject({
					min_inclusive: z.literal(0),
					max_inclusive: z.literal(64),
				}),
			}),
		}),
		...zForgeCombination(zItemIngredient).options,
	])).array().optional(),
	fluid: zGTCEUChanced(zFluidIngredient).array().optional(),
})

export const zGTCEUIOTick = z.strictObject({
	eu: zGTCEUChanced(
		z.number().int().min(1),
	).array().optional(),
	cwu: zGTCEUChanced(
		z.number().int().min(1),
	).array().optional(),
})

const zoGTCEURecipeConditions = <T extends string, D extends z.ZodType>(type: T, data: D) => {
	const simpleCondition = z.strictObject({
		type: z.literal(type),
		[type]: data,
	})
	return z.strictObject({
		recipeConditions: z.tuple([
			z.union([
				simpleCondition,
				z.strictObject({
					type: z.literal(type),
					data: z.strictObject({
						[type]: data,
					}),
				}).transform((kubejsCondition) => ({
					type: kubejsCondition.type,
					...kubejsCondition.data,
				})).pipe(simpleCondition),
			]),
		]).optional(),
	})
}

export const zoGTCEURecipeConditionsCleanroom = zoGTCEURecipeConditions(
	"cleanroom",
	z.enum(["cleanroom", "sterile_cleanroom"]),
)

export const zoGTCEURecipeConditionsResearch = zoGTCEURecipeConditions(
	"research",
	z.tuple([
		z.strictObject({
			researchId: z.string().nonempty(),
			dataItem: z.strictObject({
				id: z.enum(["gtceu:data_stick", "gtceu:data_module", "gtceu:data_orb"]),
				Count: z.literal(1),
				tag: z.strictObject({
					assembly_line_research: z.strictObject({
						research_type: z.literal("gtceu:assembly_line"),
						research_id: z.string(),
					}),
				}).optional(),
			}),
		})
			.refine(({ researchId, dataItem }) =>
				dataItem.tag === undefined ||
				researchId === dataItem.tag.assembly_line_research.research_id
			),
	]),
)

export const zoGTCEURecipeConditionsDimension = zoGTCEURecipeConditions("dimension", zDimension)

export const zGTCEURecipe = zoIdentifier.extend({
	category: zIdentifier.optional(),
	duration: z.number().int().min(0),
	inputs: zGTCEUIO,
	outputs: zGTCEUIO.optional(),
	tickInputs: zGTCEUIOTick.optional(),
	tickOutputs: zGTCEUIOTick.optional(),
	inputChanceLogics: z.strictObject({}).optional(),
	outputChanceLogics: z.strictObject({
		item: z.literal("xor").optional(),
	}).optional(),
	tickInputChanceLogics: z.strictObject({}).optional(),
	tickOutputChanceLogics: z.strictObject({}).optional(),
})
