import { z } from "zod"

export const zIdentifier = z.string()
export type Identifier = z.infer<typeof zIdentifier>

const zAmount = z.strictObject({
    amount: z.number().int().min(2).or(z.literal(0)).optional(),
    chance: z.number().positive().or(z.literal(0)).optional(),
})

export const zSimpleStack = z.strictObject({
    id: zIdentifier,
    nbt: z.string().optional(),
})
export type SimpleStack = z.infer<typeof zSimpleStack>

const withRemainder = <T extends z.ZodRawShape>(zs: z.ZodObject<T>) => zs.extend({
    remainder: zs.optional(),
})
export const zStack = z.discriminatedUnion("type", [
    withRemainder(zSimpleStack.extend(zAmount.shape).extend({
        type: z.enum(["item", "fluid"]).optional(),
    })),
    zSimpleStack.extend(zAmount.shape).extend({
        type: z.literal("tag"),
        registry: z.enum(["minecraft:item", "minecraft:fluid"]),
    }),
])
export type Stack = z.infer<typeof zStack>

export const zIngredient = z.union([
    zStack,
    zIdentifier.transform(id => ({ id })),
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
    workstations: zSimpleStack.array(),
    recipes: zRecipe.or(z.null()).array(),
})
export type Category = z.infer<typeof zCategory>
