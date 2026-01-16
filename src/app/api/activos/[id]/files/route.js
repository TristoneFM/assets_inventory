/* eslint-disable no-undef */
import { NextResponse } from 'next/server';
import { readdir, unlink } from 'fs/promises';
import path from 'path';
import { query } from '@/lib/db';

// Helper function to sanitize filename (must match the one in activos route)
function sanitizeFilename(name) {
  return name.replace(/[^a-zA-Z0-9_-]/g, '_');
}

export async function GET(request, { params }) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'ID es requerido' },
        { status: 400 }
      );
    }

    // First, get the asset to find numeroEtiqueta
    const assets = await query(
      'SELECT numeroEtiqueta FROM activos WHERE id = ?',
      [id]
    );

    if (!assets || assets.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Activo no encontrado' },
        { status: 404 }
      );
    }

    const filePrefix = sanitizeFilename(assets[0].numeroEtiqueta);

    const files = {
      pictures: [],
      pedimento: null,
      factura: null,
      archivoAlta: null,
      archivoBaja: null,
      extraFiles: [],
    };

    // Scan pictures folder
    try {
      const picturesDir = path.join(process.cwd(), 'public', 'uploads', 'pictures');
      const pictureFiles = await readdir(picturesDir);
      files.pictures = pictureFiles
        .filter(file => file.startsWith(`${filePrefix}_`) && !file.startsWith('.'))
        .map(file => `/uploads/pictures/${file}`)
        .sort();
    } catch (err) {
      // Directory might not exist or be empty
      console.log('No pictures directory or empty');
    }

    // Scan pedimentos folder
    try {
      const pedimentosDir = path.join(process.cwd(), 'public', 'uploads', 'pedimentos');
      const pedimentoFiles = await readdir(pedimentosDir);
      const pedimentoFile = pedimentoFiles.find(file => file.startsWith(`${filePrefix}_pedimento`));
      if (pedimentoFile) {
        files.pedimento = `/uploads/pedimentos/${pedimentoFile}`;
      }
    } catch (err) {
      console.log('No pedimentos directory or empty');
    }

    // Scan facturas folder
    try {
      const facturasDir = path.join(process.cwd(), 'public', 'uploads', 'facturas');
      const facturaFiles = await readdir(facturasDir);
      const facturaFile = facturaFiles.find(file => file.startsWith(`${filePrefix}_factura`));
      if (facturaFile) {
        files.factura = `/uploads/facturas/${facturaFile}`;
      }
    } catch (err) {
      console.log('No facturas directory or empty');
    }

    // Scan archivos_alta folder
    try {
      const archivosAltaDir = path.join(process.cwd(), 'public', 'uploads', 'archivos_alta');
      const archivoAltaFiles = await readdir(archivosAltaDir);
      const archivoAltaFile = archivoAltaFiles.find(file => file.startsWith(`${filePrefix}_archivo_alta`));
      if (archivoAltaFile) {
        files.archivoAlta = `/uploads/archivos_alta/${archivoAltaFile}`;
      }
    } catch (err) {
      console.log('No archivos_alta directory or empty');
    }

    // Scan archivos_baja folder
    try {
      const archivosBajaDir = path.join(process.cwd(), 'public', 'uploads', 'archivos_baja');
      const archivoBajaFiles = await readdir(archivosBajaDir);
      const archivoBajaFile = archivoBajaFiles.find(file => file.startsWith(`${filePrefix}_archivo_baja`));
      if (archivoBajaFile) {
        files.archivoBaja = `/uploads/archivos_baja/${archivoBajaFile}`;
      }
    } catch (err) {
      console.log('No archivos_baja directory or empty');
    }

    // Scan extras folder
    try {
      const extrasDir = path.join(process.cwd(), 'public', 'uploads', 'extras');
      const extraFilesList = await readdir(extrasDir);
      files.extraFiles = extraFilesList
        .filter(file => file.startsWith(`${filePrefix}_extra_`) && !file.startsWith('.'))
        .map(file => `/uploads/extras/${file}`)
        .sort();
    } catch (err) {
      console.log('No extras directory or empty');
    }

    return NextResponse.json({
      success: true,
      data: files,
    });
  } catch (error) {
    console.error('Error getting asset files:', error);
    return NextResponse.json(
      { success: false, message: 'Error al obtener archivos', error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    const { pictures = [], pedimento = false, factura = false, archivoAlta = false, extraFiles = [] } = body;

    const deletedFiles = [];

    // Delete specified pictures
    for (const picUrl of pictures) {
      try {
        const filename = picUrl.split('/').pop();
        const filePath = path.join(process.cwd(), 'public', 'uploads', 'pictures', filename);
        await unlink(filePath);
        deletedFiles.push(picUrl);
      } catch (err) {
        console.error(`Error deleting picture ${picUrl}:`, err);
      }
    }

    // Delete pedimento if requested
    if (pedimento) {
      // Get the asset to find numeroEtiqueta
      const assets = await query(
        'SELECT numeroEtiqueta FROM activos WHERE id = ?',
        [id]
      );

      if (assets && assets.length > 0) {
        const filePrefix = sanitizeFilename(assets[0].numeroEtiqueta);
        
        try {
          const pedimentosDir = path.join(process.cwd(), 'public', 'uploads', 'pedimentos');
          const pedimentoFiles = await readdir(pedimentosDir);
          const pedimentoFile = pedimentoFiles.find(file => file.startsWith(`${filePrefix}_pedimento`));
          
          if (pedimentoFile) {
            const filePath = path.join(pedimentosDir, pedimentoFile);
            await unlink(filePath);
            deletedFiles.push(`/uploads/pedimentos/${pedimentoFile}`);
          }
        } catch (err) {
          console.error('Error deleting pedimento:', err);
        }
      }
    }

    // Delete factura if requested
    if (factura) {
      const assets = await query(
        'SELECT numeroEtiqueta FROM activos WHERE id = ?',
        [id]
      );

      if (assets && assets.length > 0) {
        const filePrefix = sanitizeFilename(assets[0].numeroEtiqueta);
        
        try {
          const facturasDir = path.join(process.cwd(), 'public', 'uploads', 'facturas');
          const facturaFiles = await readdir(facturasDir);
          const facturaFile = facturaFiles.find(file => file.startsWith(`${filePrefix}_factura`));
          
          if (facturaFile) {
            const filePath = path.join(facturasDir, facturaFile);
            await unlink(filePath);
            deletedFiles.push(`/uploads/facturas/${facturaFile}`);
          }
        } catch (err) {
          console.error('Error deleting factura:', err);
        }
      }
    }

    // Delete archivoAlta if requested
    if (archivoAlta) {
      const assets = await query(
        'SELECT numeroEtiqueta FROM activos WHERE id = ?',
        [id]
      );

      if (assets && assets.length > 0) {
        const filePrefix = sanitizeFilename(assets[0].numeroEtiqueta);
        
        try {
          const archivosAltaDir = path.join(process.cwd(), 'public', 'uploads', 'archivos_alta');
          const archivoAltaFiles = await readdir(archivosAltaDir);
          const archivoAltaFile = archivoAltaFiles.find(file => file.startsWith(`${filePrefix}_archivo_alta`));
          
          if (archivoAltaFile) {
            const filePath = path.join(archivosAltaDir, archivoAltaFile);
            await unlink(filePath);
            deletedFiles.push(`/uploads/archivos_alta/${archivoAltaFile}`);
          }
        } catch (err) {
          console.error('Error deleting archivo alta:', err);
        }
      }
    }

    // Delete specified extra files
    for (const fileUrl of extraFiles) {
      try {
        const filename = fileUrl.split('/').pop();
        const filePath = path.join(process.cwd(), 'public', 'uploads', 'extras', filename);
        await unlink(filePath);
        deletedFiles.push(fileUrl);
      } catch (err) {
        console.error(`Error deleting extra file ${fileUrl}:`, err);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Archivos eliminados exitosamente',
      data: { deletedFiles },
    });
  } catch (error) {
    console.error('Error deleting files:', error);
    return NextResponse.json(
      { success: false, message: 'Error al eliminar archivos', error: error.message },
      { status: 500 }
    );
  }
}
