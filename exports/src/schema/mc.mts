import { z } from "zod"

export const zIdentifier = z.union([
	z.string().regex(/^[a-z0-9_]+:[a-z0-9_\-/.]+$/),
	z.string().regex(/^[a-z0-9_\-/.]+$/).transform((s) => "minecraft:" + s),
])
export const zoIdentifier = z.strictObject({
	id: zIdentifier,
})

export const maybeArray = <T extends z.ZodType>(of: T) => of.or(of.array())

export const zNBT = z.record(
	z.string(),
	z.unknown(),
).or(z.string())

export const zoItem = z.strictObject({
	item: zIdentifier,
})
export const zoTag = z.strictObject({ tag: zIdentifier })

export const zStack = zoItem.extend({
	count: z.number().int().min(1).max(64).optional(),
	nbt: zNBT.optional(),
	id: zIdentifier.optional(),
}).refine((o) => {
	if (!o.id) return true
	if (o.id === o.item) return delete o.id
	return false
})

export const zFluid = z.union([
	z.strictObject({
		fluid: zIdentifier,
	}),
	zoTag,
])

export const zFluidIngredient = z.strictObject({
	amount: z.number().int().min(0).max(200000),
	value: z.tuple([zFluid]).or(z.tuple([])),
	nbt: zNBT.optional(),
})

export const zItemIngredient = z.union([
	maybeArray(
		zStack.innerType().extend({
			type: z.enum(["forge:nbt", "forge:partial_nbt"])
				.transform(() => "forge:nbt" as const)
				.optional(),
		}),
	),
	maybeArray(zoTag),
	z.string().transform((id) => ({ item: id })),
	z.strictObject({
		type: z.literal("forge:difference"),
		base: zoTag,
		subtracted: zoItem,
	}),
	z.strictObject({
		/** An item that holds liquid */
		type: z.literal("gtceu:fluid_container"),
		fluid: zFluidIngredient,
	}),
])
export const zoItemIngredient = z.strictObject({
	ingredient: zItemIngredient,
})

export const zRecipeBookCategory = z.enum([
	"blocks",
	"redstone",
	"misc",
	"building",
	"equipment",
	"food",
])
export const zoRecipeBookCategory = z.strictObject({
	category: zRecipeBookCategory.optional(),
})

export const zRecipeBookGroup = z.string()
export const zoRecipeBookGroup = z.strictObject({
	group: zRecipeBookGroup.optional(),
})

export const zDimension = z.enum([
	"minecraft:overworld",
	"minecraft:the_nether",
	"minecraft:the_end",
	"javd:void",
	"lostcities:lostcities",
	"ad_astra:moon",
	"ad_astra:mars",
	"ad_astra:venus",
	"ad_astra:mercury",
	"ad_astra:glacio",
])

export const zCraftingShaped = (size: number) =>
	z.strictObject({
		pattern: z.string().min(1).max(size)
			.array().min(1).max(size),
		key: z.record(
			z.string().length(1),
			zItemIngredient,
		),
		result: zStack,
	})

type RecipeCondition = {
	type: "forge:tag_empty",
	tag: z.infer<typeof zIdentifier>,
} | {
	type: "forge:not",
	value: RecipeCondition,
} | {
	type: "forge:and" | "forge:or",
	values: RecipeCondition[],
} | {
	type: "quark:flag" | "thermal:flag" | "cucumber:feature_flag",
	flag: string,
} | {
	type: "forge:mod_loaded",
	modid: string,
} | {
	type: "sophisticatedcore:item_enabled",
	itemRegistryName: z.infer<typeof zIdentifier>,
} | {
	type: "forge:item_exists",
	item: z.infer<typeof zIdentifier>,
} | {
	type: "sophisticatedstorage:drop_packed_disabled",
}

export const zRecipeCondition: z.ZodType<RecipeCondition> = z.discriminatedUnion("type", [
	zoTag.extend({
		type: z.literal("forge:tag_empty"),
	}),
	z.strictObject({
		type: z.literal("forge:not"),
		value: z.lazy(() => zRecipeCondition),
	}),
	z.strictObject({
		type: z.enum(["forge:and", "forge:or"]),
		values: z.lazy(() => zRecipeCondition).array().nonempty(),
	}),
	z.strictObject({
		type: z.enum(["quark:flag", "thermal:flag", "cucumber:feature_flag"]),
		flag: z.string(),
	}),
	z.strictObject({
		type: z.literal("forge:mod_loaded"),
		modid: z.string().regex(/^[a-z0-9]+$/),
	}),
	z.strictObject({
		type: z.literal("sophisticatedcore:item_enabled"),
		itemRegistryName: zIdentifier,
	}),
	zoItem.extend({
		type: z.literal("forge:item_exists"),
	}),
	z.strictObject({
		type: z.literal("sophisticatedstorage:drop_packed_disabled"),
	}),
])
export const zoRecipeConditions = z.strictObject({
	conditions: zRecipeCondition.array().nonempty().optional(),
})

export const zForgeCombination = <T extends z.ZodType>(of: T) =>
	z.discriminatedUnion("type", [
		z.strictObject({
			type: z.literal("forge:intersection"),
			children: of.array(),
		}),
	])
