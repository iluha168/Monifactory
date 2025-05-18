// priority: -99999999

/**
 * Dumps all recipes json to server.log
 */

ServerEvents.recipes(event => {
    /** @type {Map<string, string>} */
    const mapRecipeIdToType = new Map()

    /** @param {Internal.RecipeJS} recipe */
    function logRecipe(recipe) {
        let id = `${recipe.getId()}`
        let jso = JSON.parse(recipe.json.toString())

        if (jso.type === "unknown")
            jso.type = mapRecipeIdToType.get(id) ?? null
        else
            mapRecipeIdToType.set(id, jso.type)

        if (recipe.removed) return

        recipe.serialize()
        console.log("[RECIPE] " + id + "\t" + JSON.stringify(jso))
    }

    event.forEachRecipe({}, logRecipe)
    event.addedRecipes.forEach(logRecipe)
})
