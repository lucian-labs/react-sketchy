/* Stand-in for dotenv, aliased in vite.demo.config.ts.
 *
 * @dank-inc/sketchy@0.26.x calls dotenv.config() at module scope inside
 * lib/config.js. dotenv is Node-only — it reaches for process.cwd(),
 * path.resolve and fs.readFileSync — and it is not declared among sketchy's
 * dependencies at all, so importing react-sketchy in a browser dies before any
 * component renders. There are no environment variables to load in a browser,
 * so the honest replacement is a no-op with dotenv's shape.
 */

export const config = () => ({ parsed: {} as Record<string, string> })
export const parse = () => ({} as Record<string, string>)

export default { config, parse }
