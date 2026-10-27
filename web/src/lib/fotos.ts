import { supabase } from './supabase'

// Phone photos are 3–8 MB; shrink before upload to save data and storage.
export async function reducirImagen(file: Blob, max = 1600, calidad = 0.82): Promise<Blob> {
  const bmp = await createImageBitmap(file)
  const escala = Math.min(1, max / Math.max(bmp.width, bmp.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bmp.width * escala)
  canvas.height = Math.round(bmp.height * escala)
  canvas.getContext('2d')!.drawImage(bmp, 0, 0, canvas.width, canvas.height)
  bmp.close()
  return new Promise((ok, mal) => canvas.toBlob(b => (b ? ok(b) : mal(new Error('No se pudo procesar la imagen'))), 'image/jpeg', calidad))
}

const nombreUnico = (ext = 'jpg') => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

/** Public vehicle photo; returns its public URL. */
export async function subirFotoVehiculo(vehiculoId: string, archivo: Blob) {
  const blob = await reducirImagen(archivo)
  const ruta = `${vehiculoId}/${nombreUnico()}`
  const { error } = await supabase.storage.from('vehiculos').upload(ruta, blob, { contentType: 'image/jpeg' })
  if (error) throw error
  return supabase.storage.from('vehiculos').getPublicUrl(ruta).data.publicUrl
}

export async function borrarFotoVehiculo(url: string) {
  const ruta = url.split('/storage/v1/object/public/vehiculos/')[1]
  if (ruta) await supabase.storage.from('vehiculos').remove([decodeURIComponent(ruta)])
}

/** Private document (delivery photos, signatures); returns its storage path. */
export async function subirDocumento(carpeta: string, archivo: Blob, reducir = true) {
  const blob = reducir ? await reducirImagen(archivo) : archivo
  const ruta = `${carpeta}/${nombreUnico(reducir ? 'jpg' : 'png')}`
  const { error } = await supabase.storage.from('documentos').upload(ruta, blob, { contentType: reducir ? 'image/jpeg' : 'image/png' })
  if (error) throw error
  return ruta
}

export async function urlsFirmadas(rutas: string[]) {
  if (!rutas.length) return {} as Record<string, string>
  const { data } = await supabase.storage.from('documentos').createSignedUrls(rutas, 3600)
  return Object.fromEntries((data ?? []).filter(d => d.signedUrl).map(d => [d.path, d.signedUrl])) as Record<string, string>
}
