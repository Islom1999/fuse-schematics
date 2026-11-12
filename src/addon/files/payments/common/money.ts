const formatter = new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: 2 })

/** Shows an amount in tiyin as sum: `150000` becomes `1 500 UZS`. */
export function formatTiyin(value: number | null | undefined): string {
  return `${formatter.format((value ?? 0) / 100)} UZS`
}

/** Converts sum (may have 2 decimals) to whole tiyin. */
export function sumToTiyin(sum: number): number {
  return Math.round(sum * 100)
}
