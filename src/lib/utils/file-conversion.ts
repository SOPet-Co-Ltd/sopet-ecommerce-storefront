/**
 * Converts File objects to base64 data URIs
 * Handles multiple files in parallel with proper error handling
 */
export async function convertFilesToBase64(files: File[]): Promise<string[]> {
  return Promise.all(
    files.map(
      (file) =>
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => {
            const result = reader.result
            if (typeof result === "string") {
              resolve(result)
            } else {
              reject(new Error("Failed to read file as string"))
            }
          }
          reader.onerror = () => {
            reject(new Error(`Failed to read file: ${file.name}`))
          }
          reader.readAsDataURL(file)
        })
    )
  )
}
