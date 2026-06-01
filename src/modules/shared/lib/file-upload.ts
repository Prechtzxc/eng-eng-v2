// File upload utility for handling payment proof uploads
export interface UploadedFile {
  id: string
  name: string
  size: number
  type: string
  url: string
  uploadedAt: string
}

export class FileUploadService {
  private static instance: FileUploadService
  private uploadedFiles: Map<string, UploadedFile> = new Map()

  static getInstance(): FileUploadService {
    if (!FileUploadService.instance) {
      FileUploadService.instance = new FileUploadService()
    }
    return FileUploadService.instance
  }

  async uploadFile(file: File, bookingId: string): Promise<UploadedFile> {
    // Validate file
    this.validateFile(file)

    // Generate unique file ID
    const fileId = `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // In a real implementation, you would upload to a cloud storage service
    // For demo purposes, we'll convert to base64 and store locally
    const base64Data = await this.fileToBase64(file)

    const uploadedFile: UploadedFile = {
      id: fileId,
      name: file.name,
      size: file.size,
      type: file.type,
      url: base64Data,
      uploadedAt: new Date().toISOString(),
    }

    // Store file reference
    this.uploadedFiles.set(fileId, uploadedFile)

    // Save to localStorage for persistence (in real app, this would be a database)
    const existingFiles = JSON.parse(localStorage.getItem("uploaded-files") || "{}")
    existingFiles[fileId] = uploadedFile
    localStorage.setItem("uploaded-files", JSON.stringify(existingFiles))

    return uploadedFile
  }

  private validateFile(file: File): void {
    const maxSize = 10 * 1024 * 1024 // 10MB
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/pdf",
      "image/heic",
      "image/heif",
    ]

    if (file.size > maxSize) {
      throw new Error("File size must be less than 10MB")
    }

    if (!allowedTypes.includes(file.type)) {
      throw new Error("File type not supported. Please upload an image or PDF file.")
    }
  }

  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = (error) => reject(error)
    })
  }

  getFile(fileId: string): UploadedFile | null {
    // Try memory first
    if (this.uploadedFiles.has(fileId)) {
      return this.uploadedFiles.get(fileId)!
    }

    // Try localStorage
    const existingFiles = JSON.parse(localStorage.getItem("uploaded-files") || "{}")
    if (existingFiles[fileId]) {
      const file = existingFiles[fileId]
      this.uploadedFiles.set(fileId, file)
      return file
    }

    return null
  }

  deleteFile(fileId: string): boolean {
    // Remove from memory
    this.uploadedFiles.delete(fileId)

    // Remove from localStorage
    const existingFiles = JSON.parse(localStorage.getItem("uploaded-files") || "{}")
    delete existingFiles[fileId]
    localStorage.setItem("uploaded-files", JSON.stringify(existingFiles))

    return true
  }
}
