import { render } from "@testing-library/react";
import { ReactSketchy, createSketch } from "../lib";

// jsdom has no 2d context, and sketchy throws without one. `canvas` has to be
// the real element — sketchy keys its running-sketch table off it.
const stubContext = () => {
  const noop = () => undefined;
  HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement) {
    const el = this;
    return new Proxy({} as CanvasRenderingContext2D, {
      get: (_t, prop) => (prop === "canvas" ? el : noop),
      set: () => true,
    });
  } as unknown as HTMLCanvasElement["getContext"];
};

// hand-driven rAF, so a frame only happens when a test asks for one. Cancelling
// really drops the callback — sketchy's teardown leans on that.
let queue = new Map<number, () => void>();
let nextId = 0;
const pump = (times = 1) => {
  for (let i = 0; i < times; i++) {
    const batch = queue;
    queue = new Map();
    batch.forEach((cb) => cb());
  }
};

let kills = 0;
const sketch = createSketch((params) => {
  params.onKill = () => {
    kills++;
  };
  return () => undefined;
});
const other = createSketch(() => () => undefined);

beforeEach(() => {
  stubContext();
  queue = new Map();
  nextId = 0;
  kills = 0;
  window.requestAnimationFrame = ((cb: FrameRequestCallback) => {
    const id = ++nextId;
    queue.set(id, () => cb(0));
    return id;
  }) as typeof window.requestAnimationFrame;
  window.cancelAnimationFrame = (id: number) => queue.delete(id) as unknown as void;
});

describe("onKill", () => {
  it("fires once on unmount", () => {
    const { unmount } = render(<ReactSketchy sketch={sketch} animate />);

    pump(2);
    unmount();
    pump(2);

    expect(kills).toEqual(1);
  });

  it("fires once when a frame lands between detach and cleanup", () => {
    const { container, unmount } = render(
      <ReactSketchy sketch={sketch} animate />
    );

    pump(1);
    // React 18 pulls the host node out in the mutation phase and only runs
    // useEffect cleanups in the later passive phase, so a queued frame can find
    // the canvas already detached — which is sketchy's other route to onKill.
    container.remove();
    pump(1);
    unmount();

    expect(kills).toEqual(1);
  });

  it("fires once when a new sketch takes over", () => {
    const { rerender } = render(<ReactSketchy sketch={sketch} animate />);

    pump(2);
    rerender(<ReactSketchy sketch={other} animate />);
    pump(2);

    expect(kills).toEqual(1);
  });
});
