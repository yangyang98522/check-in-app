export function extractTitle(content: string): string {
  const firstLine = content.split('\n')[0].trim()
  if (!firstLine) return '无标题'
  if (firstLine.length <= 20) return firstLine
  return firstLine.slice(0, 20) + '...'
}

export function extractTopics(content: string): string[] {
  const tagMatches = content.match(/#([^#\s]+)#/g) || []
  const bookMatches = content.match(/《([^》]+)》/g) || []
  const topics = [...tagMatches, ...bookMatches]
    .map((t) => t.replace(/[#《》]/g, ''))
    .filter((t) => t.length >= 2 && t.length <= 15)

  // 补充按空格或逗号分割的 2-6 字词
  const words = content
    .replace(/[#《》]/g, '')
    .split(/[\s,，.。？?！!;；、]+/)
    .filter((w) => w.length >= 2 && w.length <= 8)

  const merged = [...new Set([...topics, ...words])].slice(0, 5)
  return merged
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}
