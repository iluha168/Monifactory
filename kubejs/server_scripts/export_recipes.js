// priority: -999
/**
 * Dumps all recipes to the kubejs server log
 */

ServerEvents.recipes(event => {
    for (let recipe of event.findRecipes({})) {
        console.log(recipe.json)
    }
})
