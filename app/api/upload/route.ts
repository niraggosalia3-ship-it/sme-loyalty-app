import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { randomBytes } from 'crypto'
import { existsSync } from 'fs'
import { put } from '@vercel/blob'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 })
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 5MB' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Check if we're on Vercel (production)
    const isVercel = process.env.VERCEL === '1' || process.env.BLOB_READ_WRITE_TOKEN
    
    if (isVercel && process.env.BLOB_READ_WRITE_TOKEN) {
      // Use Vercel Blob Storage (production)
      try {
        const fileName = `banners/${randomBytes(16).toString('hex')}.${file.name.split('.').pop()}`
        const blob = await put(fileName, file, {
          access: 'public',
          contentType: file.type,
        })
        
        return NextResponse.json({ url: blob.url })
      } catch (blobError) {
        console.error('Vercel Blob error:', blobError)
        // Fallback to base64 if Blob fails
        const base64 = Buffer.from(buffer).toString('base64')
        const dataUrl = `data:${file.type};base64,${base64}`
        return NextResponse.json({ url: dataUrl })
      }
    } else {
      // Local development: Save to filesystem
      const uploadDir = join(process.cwd(), 'public', 'uploads', 'banners')
      
      // Ensure directory exists
      if (!existsSync(uploadDir)) {
        await mkdir(uploadDir, { recursive: true })
      }
      
      const fileExtension = file.name.split('.').pop()
      const fileName = `${randomBytes(16).toString('hex')}.${fileExtension}`
      const filePath = join(uploadDir, fileName)
      await writeFile(filePath, buffer)
      
      // Return the public URL
      const publicUrl = `/uploads/banners/${fileName}`
      return NextResponse.json({ url: publicUrl })
    }
  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
  }
}
