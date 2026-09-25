// Money formatting for the interface. Prices are stored as whole öre.
const kronorFormat = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

// 1240000 öre becomes "12,400 kronor".
export function formatKronor(ore: number) {
  return `${kronorFormat.format(Math.round(ore / 100))} kronor`;
}
