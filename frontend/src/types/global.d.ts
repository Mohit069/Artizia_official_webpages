export {}

declare global {
  interface Window {
    MAT: Record<string, any>
    SITE: any
    MarbleGL: {
      makeGL: (canvas: HTMLCanvasElement) => any
      draw: (ctx: any, canvas: HTMLCanvasElement, mat: any, time: number, dpr: number, zoom: number) => void
      marbleImg: (key: string, seedShift?: number) => string
      imgTag: (key: string, seedShift?: number, cls?: string) => string
      roomHTML: (key: string) => string
      slotImg: (key: string, slot: number) => string | null
      imgFor: (key: string, slot: number, seedShift?: number) => string
      firstPhoto: (key: string) => string | null
      dpr: number
      reduce: boolean
    }
    MAPDATA?: any
    buildWorldMap?: (host: HTMLElement, g: any, M: any) => void
    BLOCKS?: any
    __heroScroll?: () => void
    toast?: (m: string) => void
  }
}
