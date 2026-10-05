// @ts-check
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
            "Function|Program"(/** @type {import("@babel/core").NodePath<import("@babel/types").Function> | import("@babel/core").NodePath<import("@babel/types").Program>} */ path) {
                const body = path.isProgram() ? path : path.get("body")
                if (!body.isBlockStatement() && !body.isProgram()) return

                /** @type {Map<string, import("@babel/types").Identifier>} */
                const hoisted = new Map()
                hoistVariables(body, (id, name) => {
                    const binding = path.scope.getOwnBinding(name)
                    if (binding?.kind === "param") {
                        return // That is a function's parameter, already function-scoped and immovable.
                    }
                    if (binding && [
                        binding.path, // Where the binding was first declared.
                        ...binding.constantViolations // Where the binding was modified. Weird name for a property that says "mutations are here", but alright?
                    ].some(p => p.isFunctionDeclaration())) {
                        return // For some reason, in KubeJS, executing both "var a" and "function a() {}", in any order, throws. Ugh
                    }
                    hoisted.set(name, id)
                })
                if (hoisted.size === 0) return

                /** @type {import("@babel/core").NodePath<import("@babel/types").BlockStatement | import("@babel/types").Program>} */
                const container = body
                container.unshiftContainer("body", types.variableDeclaration(
                    "var",
                    Array.from(hoisted.values(), id => types.variableDeclarator(id)),
                ))
            },
        },
    }
}
