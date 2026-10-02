/**
 * A Babel plugin that moves all `var`s to the top of their containing functions.
 *
 * KubeJS is a buggy mess, where `var` is scoped the same way as `let`, instead of function-scoped as the standard requires.
 * This breaks Babel and core-js, which is why we should run this fixer after them.
 */

import helperHoistVariables from "@babel/helper-hoist-variables"
const hoistVariables = helperHoistVariables.default // CommonJS module hack

/** @param {import("@babel/core")} babel */
export default function hoistVarsPlugin({ types }) {
    return {
        name: "hoist-vars",
        visitor: {
            "Function|Program"(path) {
                const body = path.isProgram() ? path : path.get("body")
                if (!body.isBlockStatement() && !body.isProgram()) return

                /** @type {Map<string, import("@babel/types").Identifier>} */
                const hoisted = new Map()
                hoistVariables(body, (id, name) => {
                    if (path.scope.getOwnBinding(name)?.kind === "param") {
                        return // That is a function's parameter, already function-scoped and immovable.
                    }
                    hoisted.set(name, id)
                })
                if (hoisted.size === 0) return

                body.unshiftContainer("body", types.variableDeclaration(
                    "var",
                    Array.from(hoisted.values(), id => types.variableDeclarator(id)),
                ))
            },
        },
    }
}
