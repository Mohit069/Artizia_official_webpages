/* Loads a verbatim vendor script (blocks.js, worldmap.js, map.js) once, on demand,
   and resolves when it has executed. Keeps the imperative modules unchanged. */
const cache: Record<string, Promise<void>> = {}

export function loadScript(src: string): Promise<void> {
  if (cache[src]) return cache[src]
  cache[src] = new Promise<void>((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve()
      return
    }
    const s = document.createElement('script')
    s.src = src
    s.async = false
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('failed to load ' + src))
    document.head.appendChild(s)
  })
  return cache[src]
}
