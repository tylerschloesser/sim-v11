import invariant from 'tiny-invariant'
import { z } from 'zod'

export const TextureId = z.enum([
  'NodeNormal',
  'NodeConsumer',
  'NodeProducer',
  'NodePurifier',
  'NodeArrow',
])
export type TextureId = z.infer<typeof TextureId>

export async function renderSvgToImage(svg: SVGSVGElement) {
  return new Promise<string>((resolve) => {
    const svgString = new XMLSerializer().serializeToString(
      svg,
    )
    const svgBlob = new Blob([svgString], {
      type: 'image/svg+xml;charset=utf-8',
    })
    const url = URL.createObjectURL(svgBlob)

    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = 100
      canvas.height = 100
      const context = canvas.getContext('2d')
      invariant(context)
      context.drawImage(img, 0, 0)

      const imgBlob = canvas.toDataURL('image/png')
      resolve(imgBlob)
    }
    img.src = url
  })
}
