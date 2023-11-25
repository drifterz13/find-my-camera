export function convertTimeStringToNumber(timeString: string) {
  const units = timeString.split(' ')
  const value = parseInt(units[0])
  const type = units[1]

  switch (type) {
    case 'day(s)':
      return value * 24 * 60 * 60
    case 'hour(s)':
      return value * 60 * 60
    case 'min(s)':
      return value * 60
    default:
      return value
  }
}
