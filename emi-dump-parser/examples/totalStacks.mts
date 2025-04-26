import { fetchStacks } from "../index.mts"

const { all } = await fetchStacks()

const stats = Object.fromEntries(
	Object.entries(
		Object.groupBy(all, (stack) => stack.type),
	)
		.map(([type, stacks]) => [type, stacks.length] as const)
		.concat([["all", all.length] as const])
		.map(([type, amount]) => [type, `${amount} (${Math.round(amount / all.length * 100_00) / 1_00}%)`]),
)

console.log(stats)
