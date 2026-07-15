import dayjs from 'dayjs'

export function today(): string {
  return dayjs().format('YYYY-MM-DD')
}

export function nowTime(): string {
  return dayjs().format('HH:mm')
}

export function formatDate(dateStr: string): string {
  return dayjs(dateStr).format('MM月DD日 dddd')
}

export function formatDateTime(dateStr: string, timeStr: string): string {
  return dayjs(`${dateStr} ${timeStr}`).format('MM-DD HH:mm')
}

export function getMonthDays(year: number, month: number): string[] {
  const start = dayjs(`${year}-${month}-01`)
  const days: string[] = []
  for (let i = 0; i < start.daysInMonth(); i++) {
    days.push(start.add(i, 'day').format('YYYY-MM-DD'))
  }
  return days
}

export function getRecentDates(days: number): string[] {
  const list: string[] = []
  for (let i = days - 1; i >= 0; i--) {
    list.push(dayjs().subtract(i, 'day').format('YYYY-MM-DD'))
  }
  return list
}
