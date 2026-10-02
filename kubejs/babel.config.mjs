/**
 * Babel configuration for KubeJS.
 *
 * KubeJS runs on a fork of an old Rhino version: https://github.com/kube-mods/Rhino
 * They also backported some newer Rhino features; but they are buggy as hell, e.g. `??`.
 */

import runtime from "@babel/runtime-corejs3/package.json" with { type: "json" }

/** @type {import("@babel/core").TransformOptions} */
export default {
    targets: {
        rhino: "1.7.13"
    },
    presets: [
        ["@babel/preset-env", {
            // KubeJS throws when accessing `Symbol.iterator` of a Java collection. Not cool, dude.
            exclude: ["transform-for-of"],
        }],
    ],
    plugins: [
        // Latest ECMAScript (the JavaScript standard) support.
        ["@babel/plugin-transform-runtime", { corejs: 3, version: runtime.version }],
    ],
}
