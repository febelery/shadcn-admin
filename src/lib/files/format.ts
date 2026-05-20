/** 人类可读的文件体积 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB'] as const
  const unitIndex = Math.floor(Math.log(bytes) / Math.log(1024))
  const value = bytes / 1024 ** unitIndex
  return `${value.toFixed(unitIndex ? 1 : 0)} ${units[unitIndex]}`
}
