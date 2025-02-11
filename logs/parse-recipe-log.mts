const locate = (relative: string) => 
    import.meta.resolve(relative).slice("file://".length)

const parsed = Deno.readTextFileSync(locate("./kubejs/server.log"))
    .split("\n")
    .values()
    .map(line => {
        let match = line.match(/export_recipes\.js#\d+: (?<recipe>.*}) .*?$/)?.groups?.recipe
        if (!match) return null
        match = match.replaceAll(/([:a-zA-Z_]+?)=/g, ([,k]) => `"${k}":`)
        try {
            return JSON.parse(match)
        } catch(e) {
            console.error(line)
            throw e
        }
    })
    .filter(recipe => recipe !== null)
    .toArray()

Deno.writeTextFileSync(
    locate("./recipes.json"),
    JSON.stringify(parsed),
    { append: false }
)