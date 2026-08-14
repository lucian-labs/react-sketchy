import { useRef } from "react";
import { render, fireEvent } from "@testing-library/react";
// through the barrel on purpose — it is the surface consumers get
import { ReactSketchy, SketchBrowser, createSketch } from "../lib";

// jsdom has no 2d context, and sketchy throws without one
const stubContext = () => {
  const noop = () => undefined;
  const context = new Proxy({} as CanvasRenderingContext2D, {
    get: () => noop,
    set: () => true,
  });
  // getContext is overloaded per context id, so one stub can never structurally
  // satisfy it — the double cast is the test double, not a type weakening
  HTMLCanvasElement.prototype.getContext = (() =>
    context) as unknown as HTMLCanvasElement["getContext"];
};

// hand-driven rAF, so a frame only happens when a test asks for one
let queue: (() => void)[] = [];
const pump = (times = 1) => {
  for (let i = 0; i < times; i++) {
    const batch = queue;
    queue = [];
    batch.forEach((cb) => cb());
  }
};

let frames = 0;
const sketch = createSketch(() => () => {
  frames++;
});

beforeEach(() => {
  stubContext();
  queue = [];
  frames = 0;
  window.requestAnimationFrame = ((cb: FrameRequestCallback) => {
    queue.push(() => cb(0));
    return queue.length;
  }) as typeof window.requestAnimationFrame;
  window.cancelAnimationFrame = () => undefined;
});

describe("ReactSketchy", () => {
  it("mounts a canvas into its own div", () => {
    const { container } = render(<ReactSketchy sketch={sketch} />);

    expect(container.querySelector("canvas")).toBeInTheDocument();
  });

  it("gives every instance its own canvas", () => {
    const { container } = render(
      <>
        <ReactSketchy sketch={sketch} />
        <ReactSketchy sketch={sketch} />
      </>
    );

    const [a, b] = Array.from(container.querySelectorAll("div"));
    expect(a.querySelector("canvas")).toBeInTheDocument();
    expect(b.querySelector("canvas")).toBeInTheDocument();
  });

  it("stops the animation loop on unmount", () => {
    const { unmount } = render(<ReactSketchy sketch={sketch} animate />);

    pump(3);
    const drawn = frames;
    expect(drawn).toBeGreaterThan(1);

    unmount();
    pump(5);
    expect(frames).toEqual(drawn);
  });

  it("draws into an element the caller owns", () => {
    const Host = () => {
      const el = useRef<HTMLElement | null>(null);

      return (
        <div data-testid="host" ref={(node) => (el.current = node)}>
          <ReactSketchy sketch={sketch} elRef={el} />
        </div>
      );
    };

    const { getByTestId } = render(<Host />);

    expect(getByTestId("host").querySelector("canvas")).toBeInTheDocument();
  });

  it("removes its canvas on unmount", () => {
    const { container, unmount } = render(<ReactSketchy sketch={sketch} />);

    unmount();
    expect(container.querySelector("canvas")).toBeNull();
  });
});

describe("SketchBrowser", () => {
  const child = <ReactSketchy sketch={sketch} />;

  it("renders nothing to draw into when the set is empty", () => {
    const { container } = render(
      <SketchBrowser sketches={[]}>{child}</SketchBrowser>
    );

    expect(container.querySelector("canvas")).toBeNull();
    expect(container.textContent).toContain("0 / 0");
  });

  it("clamps the index when the set shrinks under it", () => {
    const five = [sketch, sketch, sketch, sketch, sketch];
    const { container, getByText, rerender } = render(
      <SketchBrowser sketches={five}>{child}</SketchBrowser>
    );

    fireEvent.click(getByText("Next"));
    fireEvent.click(getByText("Next"));
    expect(container.textContent).toContain("3 / 5");

    rerender(<SketchBrowser sketches={five.slice(0, 2)}>{child}</SketchBrowser>);
    expect(container.textContent).toContain("1 / 2");
  });

  it("does not page while the user is typing", () => {
    const { container, getByRole } = render(
      <>
        <input />
        <SketchBrowser sketches={[sketch, sketch]} controls>
          {child}
        </SketchBrowser>
      </>
    );

    fireEvent.keyDown(getByRole("textbox"), { code: "KeyE" });
    expect(container.textContent).toContain("1 / 2");

    fireEvent.keyDown(document, { code: "KeyE" });
    expect(container.textContent).toContain("2 / 2");
  });

  it("holds at the ends when wrap is off", () => {
    const { container, getByText } = render(
      <SketchBrowser sketches={[sketch, sketch]} wrap={false}>
        {child}
      </SketchBrowser>
    );

    fireEvent.click(getByText("Prev"));
    expect(container.textContent).toContain("1 / 2");
  });
});
