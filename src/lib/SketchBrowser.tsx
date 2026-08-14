import type { Sketch } from "@dank-inc/sketchy";
import React, { cloneElement, useCallback, useEffect, useState } from "react";
import type { ReactSketchyProps } from "./ReactSketchy";

export type SketchBrowserProps = {
  sketches: Sketch[];
  children: React.ReactElement<Partial<ReactSketchyProps>>;
  /** bind q / e to page through the set */
  controls?: boolean;
  /** render the prev / next chrome. defaults to true */
  showControls?: boolean;
  /** class on the nav element. defaults to sketch-nav */
  className?: string;
  dimensions?: [number, number];
  animate?: boolean;
  /** page past the ends and come back around. defaults to true */
  wrap?: boolean;
};

export const SketchBrowser = ({
  controls,
  showControls = true,
  className = "sketch-nav",
  sketches,
  children,
  dimensions = [400, 400],
  animate,
  wrap = true,
}: SketchBrowserProps) => {
  const [index, setIndex] = useState(0);
  const count = sketches.length;

  // the set can shrink under us — a filtered list, or an async load that starts
  // empty — so never leave the index pointing past the end of it
  useEffect(() => {
    setIndex((i) => (i > count - 1 ? 0 : i));
  }, [count]);

  const prev = useCallback(() => {
    if (!count) return;
    setIndex((i) => (i > 0 ? i - 1 : wrap ? count - 1 : 0));
  }, [count, wrap]);

  const next = useCallback(() => {
    if (!count) return;
    setIndex((i) => (i < count - 1 ? i + 1 : wrap ? 0 : i));
  }, [count, wrap]);

  useEffect(() => {
    if (!controls) return;

    const controlListener = (e: KeyboardEvent) => {
      // the listener is on document, so bail on anything the user is typing into
      const target = e.target;
      if (
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))
      )
        return;

      // leave chorded keys to the browser and the app
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      // e.code is physical, so q / e stay put on non-QWERTY layouts
      if (e.code === "KeyE") next();
      if (e.code === "KeyQ") prev();
    };
    document.addEventListener("keydown", controlListener);

    return () => document.removeEventListener("keydown", controlListener);
  }, [controls, next, prev]);

  // index is clamped in an effect, so it can be one render behind a set that
  // just shrank — render nothing rather than handing loadSketch an undefined
  const inRange = index < count;

  return (
    <>
      {showControls && (
        <div className={className}>
          <button onClick={prev} disabled={!count || (!wrap && index === 0)}>
            Prev
          </button>
          <p>
            index: {count ? Math.min(index, count - 1) + 1 : 0} / {count}
          </p>
          <button
            onClick={next}
            disabled={!count || (!wrap && index === count - 1)}
          >
            Next
          </button>
        </div>
      )}
      {inRange
        ? cloneElement(children, {
            sketch: sketches[index],
            dimensions,
            animate,
          })
        : null}
    </>
  );
};
