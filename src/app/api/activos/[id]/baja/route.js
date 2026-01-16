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
  
  // Return the public URL path
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
    
    const userBaja = formData.get('userBaja') || null;
    const comentarioBaja = formData.get('comentarioBaja') || null;
    const archivoBajaFile = formData.get('archivoBaja');

    // Validate required file
    if (!archivoBajaFile || archivoBajaFile.size === 0) {
      return NextResponse.json(
        { success: false, message: 'El archivo de baja es obligatorio' },
        { status: 400 }
      );
    }

    // Get the asset's numeroEtiqueta for file naming
    const [asset] = await query('SELECT numeroEtiqueta FROM activos WHERE id = ?', [id]);
    
    if (!asset) {
      return NextResponse.json(
        { success: false, message: 'Activo no encontrado' },
        { status: 404 }
      );
    }

    const filePrefix = sanitizeFilename(asset.numeroEtiqueta);

    // Save archivo de baja PDF
    const ext = getFileExtension(archivoBajaFile.name);
    const filename = `${filePrefix}_archivo_baja.${ext}`;
    const savedPath = await saveFile(archivoBajaFile, 'archivos_baja', filename);

    // Soft delete: change status to 'baja', set fechaBaja, userBaja, and comentarioBaja
    await query(
      `UPDATE activos 
       SET status = ?, fechaBaja = CURDATE(), userBaja = ?, comentarioBaja = ? 
       WHERE id = ?`,
      ['baja', userBaja, comentarioBaja, id]
    );

    return NextResponse.json({
      success: true,
      message: 'Activo dado de baja exitosamente',
      data: {
        archivoBaja: savedPath,
      },
    });
  } catch (error) {
    console.error('Error giving baja to activo:', error);
    return NextResponse.json(
      { success: false, message: 'Error al dar de baja el activo', error: error.message },
      { status: 500 }
    );
  }
}

