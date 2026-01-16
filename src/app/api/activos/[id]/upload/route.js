/* eslint-disable no-undef */
import { NextResponse } from 'next/server';
import { writeFile, mkdir, readdir } from 'fs/promises';
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

// Get the next available index for pictures
async function getNextPictureIndex(filePrefix) {
  try {
    const picturesDir = path.join(process.cwd(), 'public', 'uploads', 'pictures');
    const files = await readdir(picturesDir);
    const existingIndexes = files
      .filter(f => f.startsWith(`${filePrefix}_`))
      .map(f => {
        const match = f.match(/_(\d+)\./);
        return match ? parseInt(match[1]) : 0;
      });
    
    return existingIndexes.length > 0 ? Math.max(...existingIndexes) + 1 : 1;
  } catch {
    return 1;
  }
}

// Get the next available index for extra files
async function getNextExtraIndex(filePrefix) {
  try {
    const extrasDir = path.join(process.cwd(), 'public', 'uploads', 'extras');
    const files = await readdir(extrasDir);
    const existingIndexes = files
      .filter(f => f.startsWith(`${filePrefix}_extra_`))
      .map(f => {
        const match = f.match(/_extra_(\d+)_/);
        return match ? parseInt(match[1]) : 0;
      });
    
    return existingIndexes.length > 0 ? Math.max(...existingIndexes) + 1 : 1;
  } catch {
    return 1;
  }
}

export async function POST(request, { params }) {
  try {
    const { id } = params;
    const formData = await request.formData();
    
    const numeroEtiqueta = formData.get('numeroEtiqueta');
    const filePrefix = sanitizeFilename(numeroEtiqueta);

    const savedFiles = {
      pictures: [],
      pedimento: null,
      factura: null,
      archivoAlta: null,
      extraFiles: [],
    };

    // Get starting index for new pictures
    let pictureIndex = await getNextPictureIndex(filePrefix);

    // Save new pictures
    const assetPictures = formData.getAll('assetPictures');
    for (const picture of assetPictures) {
      if (picture && picture.size > 0) {
        const ext = getFileExtension(picture.name);
        const filename = `${filePrefix}_${pictureIndex}.${ext}`;
        const savedPath = await saveFile(picture, 'pictures', filename);
        savedFiles.pictures.push(savedPath);
        pictureIndex++;
      }
    }

    // Save pedimento
    const pedimentoFile = formData.get('pedimento');
    if (pedimentoFile && pedimentoFile.size > 0) {
      const ext = getFileExtension(pedimentoFile.name);
      const filename = `${filePrefix}_pedimento.${ext}`;
      savedFiles.pedimento = await saveFile(pedimentoFile, 'pedimentos', filename);
    }

    // Save factura
    const facturaFile = formData.get('factura');
    if (facturaFile && facturaFile.size > 0) {
      const ext = getFileExtension(facturaFile.name);
      const filename = `${filePrefix}_factura.${ext}`;
      savedFiles.factura = await saveFile(facturaFile, 'facturas', filename);
    }

    // Save archivo de alta
    const archivoAltaFile = formData.get('archivoAlta');
    if (archivoAltaFile && archivoAltaFile.size > 0) {
      const ext = getFileExtension(archivoAltaFile.name);
      const filename = `${filePrefix}_archivo_alta.${ext}`;
      savedFiles.archivoAlta = await saveFile(archivoAltaFile, 'archivos_alta', filename);
    }

    // Save extra files
    const extraFiles = formData.getAll('extraFiles');
    // Get starting index for extra files
    let extraIndex = await getNextExtraIndex(filePrefix);
    for (const file of extraFiles) {
      if (file && file.size > 0) {
        const ext = getFileExtension(file.name);
        const originalName = file.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
        const filename = `${filePrefix}_extra_${extraIndex}_${originalName}.${ext}`;
        const savedPath = await saveFile(file, 'extras', filename);
        savedFiles.extraFiles.push(savedPath);
        extraIndex++;
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Archivos subidos exitosamente',
      data: savedFiles,
    });
  } catch (error) {
    console.error('Error uploading files:', error);
    return NextResponse.json(
      { success: false, message: 'Error al subir archivos', error: error.message },
      { status: 500 }
    );
  }
}

