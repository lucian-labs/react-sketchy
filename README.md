# React Sketchy!

**[Live demo →](https://react-sketchy.lucianlabs.ca)** · [npm](https://www.npmjs.com/package/@dank-inc/react-sketchy) · [all packages](https://lucianlabs.ca/packages/)

A dank wrapper for [Sketchy!](https://github.com/dank-inc/sketchy).

Simply input your sketch into the react component prop and call'er a day, bud!

# Usage

```tsx
import { ReactSketchy, createSketch, Sketch } from "@dank-inc/react-sketchy";

// module scope, so the identity is stable — see below
const dankSketch = createSketch(({ context, width, height }) => {
  context.clearRect(0, 0, width, height);

  return ({ context, width, height, t, setFillStyle }) => {
    context.clearRect(0, 0, width, height);

    const qw = width / 4;
    const qh = height / 4;
    setFillStyle(hsl(t(), 0.5, 0.5));

    context.save();
    context.translate(width / 2, height / 2);
    context.rotate(t(1));

    context.fillRect(-qw, -qh, width / 2, height / 2);
    context.restore();
  };
});

const App = () => (
  <>
    <h1>A dank sketch!</h1>
    <ReactSketchy animate dimensions={[600, 600]} sketch={dankSketch} />
  </>
);
```

et voila!

**Memoize your sketch.** Reloading it means tearing the canvas down and starting
over from t=0, so the effect reruns whenever the `sketch` identity changes. An
arrow function written inline in JSX is a new identity on every parent render —
put the sketch at module scope, or wrap it in `useCallback`. `dimensions` is
compared by value, so an inline tuple is fine.

## Props

### `ReactSketchy`

| prop         | default | what it does                                                       |
| ------------ | ------- | ------------------------------------------------------------------ |
| `sketch`     | —       | the `Sketch` to load                                               |
| `dimensions` | element | `[w, h]` of the canvas; falls back to the container's client size  |
| `animate`    | `false` | run the sketch as a rAF loop rather than a single frame            |
| `className`  | —       | class on the div it renders                                        |
| `elRef`      | —       | render into an element you own; the component then renders nothing |

This is 2d only. 3d sketches live in
[@dank-inc/sketchy-3d](https://github.com/dank-inc/sketchy-3d) and have their own
loader; nothing here loads three.js.

### `SketchBrowser`

| prop           | default        | what it does                                  |
| -------------- | -------------- | --------------------------------------------- |
| `sketches`     | —              | the set to page through                       |
| `children`     | —              | one element, cloned per selection             |
| `controls`     | `false`        | bind q / e to prev / next                     |
| `showControls` | `true`         | render the prev / next chrome                 |
| `className`    | `"sketch-nav"` | class on that chrome                          |
| `wrap`         | `true`         | page past the ends and come back around       |
| `dimensions`   | `[400, 400]`   | passed through to the child                   |
| `animate`      | `false`        | passed through to the child                   |

The child is cloned with `sketch`, `dimensions` and `animate`, so whatever you
pass for those at the JSX site is a placeholder:

```tsx
<SketchBrowser sketches={sketches} controls animate>
  <ReactSketchy sketch={sketches[0]} />
</SketchBrowser>
```
