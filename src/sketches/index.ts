import { createSketch, color } from "@dank-inc/sketchy";
import keepItGay from "./keep-it-gay";

const basic = createSketch(({ context, width, height }) => {
  context.clearRect(0, 0, width, height);

  return ({ context, width, height, t, setFillStyle }) => {
    context.clearRect(0, 0, width, height);
    const qw = width / 4;
    const qh = height / 4;
    setFillStyle(color.hsl(t(), 0.5, 0.5));

    context.save();
    context.translate(width / 2, height / 2);
    context.rotate(t(1));

    context.fillRect(-qw, -qh, width / 2, height / 2);
    context.restore();
  };
});

export default [basic, keepItGay];
