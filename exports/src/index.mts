import { recipes } from "./parseExports.mts"

const enum Commands {
	GenerateRecipesFile = "recipes",
}

const commandHandlers: Record<Commands, () => void> = {
	[Commands.GenerateRecipesFile]: async () => {
		const path = Deno.args[0]
		if (!path) {
			console.error("No file path specified")
			Deno.exit(2)
		}
		await Deno.writeTextFile(path, JSON.stringify(recipes.toArray()))
	},
}

const command = Deno.args.shift()!
if (command in commandHandlers)
	commandHandlers[command as Commands]()
else {
	console.error(`Unknown subcommand! Possible values: ${Object.keys(commandHandlers).join(", ")}.`)
	Deno.exit(1)
}
