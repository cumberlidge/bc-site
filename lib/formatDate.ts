export function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));

  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  return `${parseInt(day)} ${monthNames[date.getMonth()]} ${year}`;
}
