/* react-sketchy demo — https://react-sketchy.lucianlabs.ca
 *
 * The sketches here are written against @dank-inc/sketchy 0.26.x, which is what
 * this package's `^0.26.3` dependency actually resolves to — sketchy itself is
 * on 1.1.1, and a caret range on a 0.x version never crosses to 1.x. That older
 * params object has no `data` bag and its circle/shape helpers take no options,
 * so live controls are held in module scope and read per frame.
 *
 * Only type="2d" is exercised. The 3d path calls create3dParams with a
 * hardcoded containerId of "dank-vision", so it ignores the component's own ref
 * — see the review.
 */

import { StrictMode, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { ReactSketchy, SketchBrowser } from '@dank-inc/react-sketchy'
import type { Sketch } from '@dank-inc/sketchy'

/* live controls, read by the frame functions */
const knobs = { density: 1, speed: 1 }

/* ── sketches ───────────────────────────────────────────────────────────── */

const bloom: Sketch = ({ width, height, TAU }) => {
  return ({ context, t }) => {
    const time = t(1) * knobs.speed
    context.clearRect(0, 0, width, height)
    const petals = Math.max(3, Math.round(9 * knobs.density))
    for (let p = 0; p < petals; p++) {
      const pu = p / petals
      for (let i = 0; i < 40; i++) {
        const u = i / 40
        const a = pu * TAU + u * 2.2 + time * 0.25
        const r = u * Math.min(width, height) * 0.42
        const x = width / 2 + Math.cos(a) * r
        const y = height / 2 + Math.sin(a) * r
        context.fillStyle = `hsla(${((pu * 300 + u * 60 + time * 20) % 360).toFixed(0)}, 65%, ${
          35 + u * 35
        }%, 0.85)`
        const s = (1 - u) * 7 + 1
        context.fillRect(x - s / 2, y - s / 2, s, s)
      }
    }
  }
}

const weave: Sketch = ({ width, height }) => {
  return ({ context, t }) => {
    const time = t(1) * knobs.speed
    context.clearRect(0, 0, width, height)
    const lines = Math.max(6, Math.round(34 * knobs.density))
    context.lineWidth = 1.3
    for (let i = 0; i < lines; i++) {
      const u = i / (lines - 1)
      context.beginPath()
      for (let x = 0; x <= width; x += 5) {
        const xu = x / width
        const y =
          height / 2 +
          Math.sin(xu * 7 + time + u * 5) * height * 0.2 +
          (u - 0.5) * height * 0.72
        x === 0 ? context.moveTo(x, y) : context.lineTo(x, y)
      }
      context.strokeStyle = `hsla(${((280 + u * 60) % 360).toFixed(0)}, 60%, ${40 + u * 25}%, 0.7)`
      context.stroke()
    }
  }
}

const drift: Sketch = ({ width, height, TAU }) => {
  const seeds = Array.from({ length: 160 }, (_, i) => ({
    u: (i * 0.6180339887) % 1,
    v: (i * 0.2442) % 1,
  }))
  return ({ context, t }) => {
    const time = t(1) * knobs.speed
    context.clearRect(0, 0, width, height)
    const shown = Math.max(10, Math.round(seeds.length * knobs.density))
    for (let i = 0; i < shown; i++) {
      const s = seeds[i]
      const a = s.u * TAU + time * 0.4
      const x = (s.u * width + Math.cos(a) * 40 + width) % width
      const y = (s.v * height + Math.sin(a * 1.3) * 40 + height) % height
      const size = 2 + Math.abs(Math.sin(a)) * 6
      context.fillStyle = `hsla(${((200 + s.v * 140) % 360).toFixed(0)}, 70%, ${
        45 + s.u * 25
      }%, 0.8)`
      context.fillRect(x, y, size, size)
    }
  }
}

const SKETCHES = [bloom, weave, drift]
const NAMES = ['bloom', 'weave', 'drift']

/* ── view helpers ───────────────────────────────────────────────────────── */

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  // @ts-expect-error — waveloop custom elements are not in JSX.IntrinsicElements
  <wl-section title={title}>{children}</wl-section>
)

const Code = ({ children }: { children: string }) => <pre className="wl-code">{children}</pre>

const Knob = ({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (v: number) => void
}) => (
  <div className="wl-panel">
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
      <span className="wl-silk">{label}</span>
      <span className="wl-mono" style={{ color: 'var(--wl-accent-hi)' }}>
        {value.toFixed(2)}
      </span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      style={{ width: '100%', marginTop: '0.6rem', accentColor: 'var(--wl-accent)' }}
    />
  </div>
)

/* ── panels ─────────────────────────────────────────────────────────────── */

const StagePanel = () => {
  const [which, setWhich] = useState(0)
  const [density, setDensity] = useState(1)
  const [speed, setSpeed] = useState(1)

  knobs.density = density
  knobs.speed = speed

  const sketch = useMemo(() => SKETCHES[which], [which])

  return (
    <>
      <Section title="ReactSketchy">
        <p className="wl-muted">
          One component, one sketch. The effect creates the canvas on mount and tears it down on
          unmount, so changing the sketch below is a real remount rather than a re-render.
        </p>

        <p className="wl-muted">
          There is exactly one stage on this page on purpose. sketchy resolves its drawing surface
          with <code>document.querySelector('canvas')</code>, which finds the first canvas in the
          whole document rather than one inside the container it was given — so two ReactSketchy
          components mounted as siblings both bind to the same element and one of them wins. That
          constraint is the reason SketchBrowser drives this same stage instead of previewing into a
          second one.
        </p>

        <Code>{`<SketchBrowser sketches={[bloom, weave, drift]} controls animate>
  <ReactSketchy type="2d" sketch={${NAMES[which]}} dimensions={[900, 460]} animate />
</SketchBrowser>`}</Code>

        <div
          style={{
            marginTop: '0.75rem',
            border: '2px solid color-mix(in oklab, var(--wl-accent) 32%, var(--wl-line))',
            background: 'var(--wl-bg-deep)',
            padding: '0.9rem',
          }}
        >
          <SketchBrowser sketches={SKETCHES} controls animate dimensions={[900, 460]}>
            <ReactSketchy
              key={which}
              type="2d"
              sketch={sketch}
              dimensions={[900, 460]}
              animate
            />
          </SketchBrowser>
        </div>

        <div className="wl-row" style={{ marginTop: '0.75rem' }}>
          {NAMES.map((n, i) => (
            <button
              key={n}
              className={`wl-btn${which === i ? '' : ' wl-btn--ghost'}`}
              onClick={() => setWhich(i)}
            >
              {n}
            </button>
          ))}
          <span className="wl-silk">or press q / e</span>
        </div>

        <div className="wl-grid" style={{ marginTop: '0.75rem' }}>
          <Knob label="density" value={density} min={0.1} max={1.5} step={0.01} onChange={setDensity} />
          <Knob label="speed" value={speed} min={0} max={3} step={0.01} onChange={setSpeed} />
        </div>
      </Section>

      <Section title="SketchBrowser">
        <p className="wl-muted">
          The wrapper around the stage above. Hand it an array and a child element to clone per
          sketch: it keeps the index, renders prev / next, and with <code>controls</code> set it binds
          q and e to page through from the keyboard.
        </p>
        <Code>{`<SketchBrowser sketches={sketches} controls animate dimensions={[900, 460]}>
  <ReactSketchy type="2d" sketch={sketches[0]} dimensions={[900, 460]} animate />
</SketchBrowser>`}</Code>
      </Section>
    </>
  )
}

const Install = () => (
  <Section title="install">
    {/* @ts-expect-error — custom element */}
    <wl-install pkg="@dank-inc/react-sketchy" />
    <div style={{ marginTop: '0.75rem' }}>
      <Code>{`import { ReactSketchy, SketchBrowser } from '@dank-inc/react-sketchy'
import type { Sketch } from '@dank-inc/sketchy'

const bloom: Sketch = ({ width, height, TAU }) => ({ context, t }) => {
  // per-frame drawing
}`}</Code>
    </div>
  </Section>
)

const Api = () => (
  <Section title="api">
    <div className="wl-api__scroll">
      <table className="wl-api">
        <thead>
          <tr>
            <th>export</th>
            <th>kind</th>
            <th>signature</th>
            <th>what it does</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>ReactSketchy</td>
            <td>component</td>
            <td>{'{ type, sketch, dimensions?, animate?, className?, elRef? }'}</td>
            <td>Mounts a sketch into its own div. The effect owns load and teardown.</td>
          </tr>
          <tr>
            <td>SketchBrowser</td>
            <td>component</td>
            <td>{'{ sketches, children, controls?, dimensions?, animate?, wrap? }'}</td>
            <td>Holds an index over a set of sketches and clones the child per selection.</td>
          </tr>
          <tr>
            <td>props.elRef</td>
            <td>prop</td>
            <td>{'MutableRefObject<HTMLElement | null>'}</td>
            <td>Render into an element you own instead of the component’s own div.</td>
          </tr>
          <tr>
            <td>props.type</td>
            <td>prop</td>
            <td>{"'2d' | '3d'"}</td>
            <td>Picks the sketchy loader. Only 2d is exercised here — see the review on the 3d path.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </Section>
)

const App = () => (
  <>
    <Install />
    <StagePanel />
    <Api />
  </>
)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
