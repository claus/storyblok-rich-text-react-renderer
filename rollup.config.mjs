import babel from "@rollup/plugin-babel";
import commonjs from "@rollup/plugin-commonjs";
import external from "rollup-plugin-peer-deps-external";
import { readFile } from "fs/promises";

const pkg = JSON.parse(
  await readFile(new URL("./package.json", import.meta.url))
);

export default {
  input: "src/index.js",
  output: [
    {
      file: pkg.main,
      format: "cjs",
      sourcemap: true,
    },
    {
      file: pkg.module,
      format: "es",
      sourcemap: true,
    },
  ],
  plugins: [babel({ babelHelpers: "bundled" }), external(), commonjs()],
};
