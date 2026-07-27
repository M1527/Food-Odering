const currencyFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
})

export function formatCurrency(value: string | number) {
  return currencyFormatter.format(Number(value))
}
