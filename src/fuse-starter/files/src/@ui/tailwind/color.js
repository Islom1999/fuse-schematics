// @ts-check
/**
 * Color math for the theme palettes (Node, build time only).
 * Mixing is done in linear RGB (square the 8-bit channels, interpolate, take the root);
 * contrast is the WCAG 2 ratio.
 */

/** The palette keys, in order. */
const SHADES = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950']

/** @typedef {[number, number, number]} Rgb */

/**
 * @param {string} hex `#rgb` or `#rrggbb`
 * @returns {Rgb}
 */
function parseHex(hex) {
  let value = hex.trim().replace(/^#/, '')
  if (value.length === 3) value = [...value].map((char) => char + char).join('')
  if (!/^[0-9a-f]{6}$/i.test(value)) throw new Error(`[ui] Not a hex color: "${hex}"`)
  return [0, 2, 4].map((index) => parseInt(value.slice(index, index + 2), 16))
}

/**
 * @param {Rgb} rgb
 * @returns {string} lower-case `#rrggbb`
 */
function toHex(rgb) {
  return '#' + rgb.map((channel) => Math.round(channel).toString(16).padStart(2, '0')).join('')
}

/**
 * Mixes `from` toward `to` by `amount` (0..1) in linear RGB. Channels are not rounded.
 * @param {Rgb} from
 * @param {Rgb} to
 * @param {number} amount
 * @returns {Rgb}
 */
function mixLinear(from, to, amount) {
  return /** @type {Rgb} */ (from.map((channel, index) => Math.sqrt(channel ** 2 * (1 - amount) + to[index] ** 2 * amount)))
}

/**
 * @param {Rgb} rgb
 * @returns {Rgb}
 */
function round(rgb) {
  return /** @type {Rgb} */ (rgb.map((channel) => Math.round(channel)))
}

/**
 * WCAG relative luminance.
 * @param {string} hex
 */
function luminance(hex) {
  const [r, g, b] = parseHex(hex).map((channel) => {
    const c = channel / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/**
 * WCAG contrast ratio of two colors (1..21).
 * @param {string} a
 * @param {string} b
 */
function contrast(a, b) {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (light + 0.05) / (dark + 0.05)
}

/**
 * Generates shades 50–900 from one base color (it becomes the 500 shade), or from a partial palette
 * that has a `500` key (every given shade is an extra stop).
 * The scale runs from a near-white end-point (white mixed 1/49 toward the base) through the base to a
 * dark end-point (black mixed 1/9 toward the base); shade N is sampled at N/1000.
 * @param {string | Record<string, string>} input
 * @returns {Record<string, string>}
 */
function generatePalette(input) {
  const given = typeof input === 'string' ? { 500: input } : input
  if (!given['500']) throw new Error('[ui] generatePalette() needs a 500 shade.')
  const base = parseHex(given['500'])
  const light = round(mixLinear([255, 255, 255], base, 1 / 49))
  const dark = round(mixLinear([0, 0, 0], base, 1 / 9))

  /** @type {Array<[number, Rgb]>} */
  const stops = [
    [0, light],
    [1, dark],
    ...Object.entries(given)
      .filter(([key]) => /^\d+$/.test(key))
      .map(([key, hex]) => /** @type {[number, Rgb]} */ ([Number(key) / 1000, parseHex(hex)])),
  ]
  stops.sort((a, b) => a[0] - b[0])

  /** @param {number} t */
  const sample = (t) => {
    const upper = stops.findIndex(([position]) => position >= t)
    if (stops[upper][0] === t) return stops[upper][1]
    const [startAt, start] = stops[upper - 1]
    const [endAt, end] = stops[upper]
    return mixLinear(start, end, (t - startAt) / (endAt - startAt))
  }

  /** @type {Record<string, string>} */
  const palette = {}
  for (const shade of SHADES.slice(0, -1)) palette[shade] = toHex(sample(Number(shade) / 1000))
  return palette
}

/**
 * Builds the contrast ("on-") palette: for each key, white or the palette's darkest color
 * (highest contrast against white), whichever reads better. White wins ties.
 * @param {Record<string, string>} palette
 * @returns {Record<string, string>}
 */
function contrastPalette(palette) {
  const white = '#FFFFFF'
  const colors = Object.values(palette)
  const anchor = colors.reduce((best, color) => (contrast(color, white) > contrast(best, white) ? color : best))
  /** @type {Record<string, string>} */
  const result = {}
  for (const [key, color] of Object.entries(palette)) {
    result[key] = contrast(color, anchor) > contrast(color, white) ? anchor : white
  }
  return result
}

/**
 * Returns `"r g b"` for a hex color, or for an `rgba()`/`rgb()` color (alpha dropped).
 * @param {string} color
 */
function toTriplet(color) {
  const match = color.match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i)
  if (match) return `${match[1]} ${match[2]} ${match[3]}`
  return parseHex(color).join(' ')
}

module.exports = { SHADES, parseHex, toHex, mixLinear, luminance, contrast, generatePalette, contrastPalette, toTriplet }
