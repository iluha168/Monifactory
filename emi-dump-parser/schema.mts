import { z } from "zod"

export const zIdentifier = z.string()
export type Identifier = z.infer<typeof zIdentifier>

const zAmount = z.strictObject({
	amount: z.number().int().min(0).optional(),
	chance: z.number().min(0).optional(),
})

export const zSimpleStack = zAmount.extend({
	id: zIdentifier,
	nbt: z.string().optional(),
})
export type SimpleStack = z.infer<typeof zSimpleStack>

const withRemainder = <T extends z.ZodRawShape>(zs: z.ZodObject<T>) =>
	zs.extend({
		remainder: zs.optional(),
	})
export const zStack = z.discriminatedUnion("type", [
	withRemainder(
		zSimpleStack.extend({
			type: z.enum(["item", "fluid"]),
		}),
	),
	zSimpleStack.extend({
		type: z.literal("tag"),
		registry: z.enum(["minecraft:item", "minecraft:fluid"]),
	}),
])
export type Stack = z.infer<typeof zStack>

export const zIngredient = z.union([
	zStack,
	zIdentifier.transform((id) => ({ id })),
	z.null(),
	zAmount.extend({
		stacks: zStack.array().nonempty().optional(),
	}),
])
export type Ingredient = z.infer<typeof zIngredient>

export const zRecipe = z.strictObject({
	id: zIdentifier.optional(),
	inputs: zIngredient.array(),
	outputs: zIngredient.array(),
	catalysts: zIngredient.array(),
	texts: z.string().array().nonempty().optional(),
})
export type Recipe = z.infer<typeof zRecipe>

export const zCategory = z.strictObject({
	id: zIdentifier,
	workstations: zStack.array(),
	recipes: zRecipe.or(z.null()).array(),
})
export type Category = z.infer<typeof zCategory>

export const zStacksFile = z.strictObject({
	all: zStack.array(),
	hidden: zStack.array(),
}).transform((stacks) => ({
	...stacks,
	visible: () => {
		const stackToStr = (stack: Stack) => stack.type + "@" + stack.id + "@" + stack.nbt
		const hiddenIds = new Set(stacks.hidden.map(stackToStr))
		return stacks.all.filter((stack) => !hiddenIds.has(stackToStr(stack)))
	},
}))
export type StacksFile = z.infer<typeof zStacksFile>
