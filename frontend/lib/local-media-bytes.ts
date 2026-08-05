export function exactArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer
}

export async function readLocalMediaArrayBuffer(url: string): Promise<ArrayBuffer> {
  if (url.startsWith('file://') && window.electronAPI?.readLocalFileBytes) {
    const { bytes } = await window.electronAPI.readLocalFileBytes(url)
    return exactArrayBuffer(bytes)
  }

  const response = await fetch(url)
  return await response.arrayBuffer()
}
