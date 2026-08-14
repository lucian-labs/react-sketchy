# React Sketchy!

**[Live demo →](https://react-sketchy.lucianlabs.ca)** · [npm](https://www.npmjs.com/package/@dank-inc/react-sketchy) · [all packages](https://lucianlabs.ca/packages/)

A dank wrapper for [Sketchy!](https://github.com/dank-inc/sketchy).

Simply input your sketch into the react component prop and call'er a day, bud!

# Usage

```tsx
<App>
  <h1>A dank sketch!</h1>
  <ReactSketchy
    animate
    dimensions={[600, 600]}
    sketch={({ context, width, height }) => {
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
    }}
  />
</App>
```

et voila!
