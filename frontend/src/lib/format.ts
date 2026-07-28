const currencyFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
})

export function formatCurrency(value: string | number) {
  return currencyFormatter.format(Number(value))
}

const dateFormatter = new Intl.DateTimeFormat('vi-VN', {
  dateStyle: 'medium',
})

export function formatDate(value: string | Date) {
  return dateFormatter.format(new Date(value))
}
