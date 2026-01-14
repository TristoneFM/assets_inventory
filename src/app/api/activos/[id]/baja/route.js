/* eslint-disable no-undef */
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

// Helper function to save a file
async function saveFile(file, folder, filename) {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', folder);
  
  // Ensure directory exists
  await mkdir(uploadDir, { recursive: true });
  
  const filePath = path.join(uploadDir, filename);
  await writeFile(filePath, buffer);
  
  return `/uploads/${folder}/${filename}`;
}

// Helper function to get file extension
function getFileExtension(filename) {
  return filename.split('.').pop().toLowerCase();
}

// Helper function to sanitize filename
function sanitizeFilename(name) {
  return name.replace(/[^a-zA-Z0-9_-]/g, '_');
}

export async function POST(request, { params }) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'ID es requerido' },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    
    const userBaja = formData.get('userBaja') || 'unknown';
    const comentarioBaja = formData.get('comentarioBaja') || null;
    const formatoBajaFile = formData.get('formatoBaja');

    // Validate formato de baja file is provided
    if (!formatoBajaFile || formatoBajaFile.size === 0) {
      return NextResponse.json(
        { success: false, message: 'El formato de baja es requerido' },
        { status: 400 }
      );
    }

    // Get the asset to find numeroEtiqueta
    const assets = await query(
      'SELECT numeroEtiqueta, status FROM activos WHERE id = ?',
      [id]
    );

    if (!assets || assets.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Activo no encontrado' },
        { status: 404 }
      );
    }

    const asset = assets[0];

    // Check if already "baja"
    if (asset.status === 'baja') {
      return NextResponse.json(
        { success: false, message: 'El activo ya está dado de baja' },
        { status: 400 }
      );
    }

    // Save formato de baja file
    const filePrefix = sanitizeFilename(asset.numeroEtiqueta);
    const ext = getFileExtension(formatoBajaFile.name);
    const filename = `${filePrefix}_formatoBaja.${ext}`;
    await saveFile(formatoBajaFile, 'formatosBaja', filename);

    // Update the asset to baja status
    await query(
      `UPDATE activos SET 
        status = 'baja', 
        fechaBaja = CURDATE(), 
        userBaja = ?,
        comentarioBaja = ?
      WHERE id = ?`,
      [userBaja, comentarioBaja, id]
    );

    return NextResponse.json({
      success: true,
      message: 'Activo dado de baja exitosamente',
    });
  } catch (error) {
    console.error('Error giving baja to asset:', error);
    return NextResponse.json(
      { success: false, message: 'Error al dar de baja el activo', error: error.message },
      { status: 500 }
    );
  }
}

