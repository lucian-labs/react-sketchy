import { MutableRefObject, useEffect, useRef } from "react";
import { createParams, loadSketch } from "@dank-inc/sketchy";
import type { Sketch } from "@dank-inc/sketchy";

export type ReactSketchyProps = {
  sketch: Sketch;
  className?: string;
  elRef?: MutableRefObject<HTMLElement | null>;
  dimensions?: [number, number];
  animate?: boolean;
};

export const ReactSketchy = ({
  sketch,
  dimensions,
  className,
  animate,
  elRef,
}: ReactSketchyProps) => {
  const ref = useRef<HTMLDivElement | null>(null);

  // deps compare the tuple by value; an inline dimensions={[600, 600]} is a new
  // identity every render and would otherwise tear the canvas down each time.
  const width = dimensions?.[0];
  const height = dimensions?.[1];

  useEffect(() => {
    // refs are attached before passive effects run, so a caller's elRef is
    // already populated here on the first commit.
    const el = elRef?.current ?? ref.current;
    if (!el) return;

    const params = loadSketch(
      sketch,
      createParams({
        element: el,
        dimensions,
        animate,
      })
    );

    // sketchy calls the outgoing sketch's onKill itself — when a new sketch
    // takes the canvas, and when a frame finds the canvas already detached —
    // while on unmount nothing reaches it but the cleanup below. Both routes
    // have to stay, and React 18 detaches the canvas a phase before it runs
    // that cleanup, so both can fire for one teardown. Put the consumer's
    // handler behind a single-shot wrapper and let whichever side gets there
    // first be the only call. The sketch assigns onKill while loadSketch runs,
    // hence wrapping after it returns.
    const onKill = params.onKill;
    let killed = false;
    const kill = () => {
      if (killed) return;
      killed = true;
      onKill?.();
    };
    params.onKill = kill;

    return () => {
      params.stop();
      kill();
      // only the canvas sketchy marked as its own — an element handed to us
      // through elRef may hold children the caller put there.
      el.querySelector(":scope > canvas[data-sketchy]")?.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sketch, elRef, width, height, animate]);

  if (elRef) return null;

  return <div className={className} ref={ref}></div>;
};
