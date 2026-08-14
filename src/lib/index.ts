export { ReactSketchy } from "./ReactSketchy";
export type { ReactSketchyProps } from "./ReactSketchy";
export { SketchBrowser } from "./SketchBrowser";
export type { SketchBrowserProps } from "./SketchBrowser";

// re-exported so a consumer can type their sketches without adding
// @dank-inc/sketchy to their own package.json — it is ours, and under a strict
// (non-hoisting) package manager theirs would not resolve
export { createSketch } from "@dank-inc/sketchy";
export type {
  Sketch,
  Frame,
  SketchyParams,
  SketchConfig,
} from "@dank-inc/sketchy";
