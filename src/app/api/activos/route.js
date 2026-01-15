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

// Helper function to sanitize filename (remove special characters)
function sanitizeFilename(name) {
  return name.replace(/[^a-zA-Z0-9_-]/g, '_');
}

export async function POST(request) {
  try {
    const formData = await request.formData();

    // Extract form fields
    const assetData = {
      numeroActivo: formData.get('numeroActivo'),
      numeroEtiqueta: formData.get('numeroEtiqueta'),
      tipo_id: formData.get('tipo'),
      marca: formData.get('marca'),
      modelo: formData.get('modelo'),
      serie: formData.get('serie') || null,
      ubicacion_id: formData.get('ubicacion'),
      planta_id: formData.get('planta'),
      nacionalExtranjero: formData.get('nacionalExtranjero'),
      numeroPedimento: formData.get('numeroPedimento') || null,
      fechaAlta: formData.get('fechaAlta') || null,
      userAlta: formData.get('userAlta') || null,
      numeroCapex: formData.get('numeroCapex') || null,
      ordenInterna: formData.get('ordenInterna') || null,
      observaciones: formData.get('observaciones') || null,
      statusCipFa: formData.get('statusCipFa') || null,
    };

    // Extract files
    const assetPictures = formData.getAll('assetPictures');
    const pedimentoFile = formData.get('pedimento');
    const facturaFile = formData.get('factura');

    // Validate required fields
    if (!assetData.numeroActivo || !assetData.numeroEtiqueta || !assetData.tipo_id ||
        !assetData.marca || !assetData.modelo || !assetData.ubicacion_id ||
        !assetData.planta_id || !assetData.nacionalExtranjero) {
      return NextResponse.json(
        { success: false, message: 'Todos los campos requeridos deben ser completados' },
        { status: 400 }
      );
    }

    // Insert into database
    const result = await query(
      `INSERT INTO activos (numeroActivo, numeroEtiqueta, tipo_id, marca, modelo, serie, 
        ubicacion_id, planta_id, nacionalExtranjero, numeroPedimento, status, fechaAlta, userAlta,
        numeroCapex, ordenInterna, observaciones, statusCipFa) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'activo', ?, ?, ?, ?, ?, ?)`,
      [
        assetData.numeroActivo,
        assetData.numeroEtiqueta,
        assetData.tipo_id,
        assetData.marca,
        assetData.modelo,
        assetData.serie,
        assetData.ubicacion_id,
        assetData.planta_id,
        assetData.nacionalExtranjero,
        assetData.numeroPedimento,
        assetData.fechaAlta,
        assetData.userAlta,
        assetData.numeroCapex,
        assetData.ordenInterna,
        assetData.observaciones,
        assetData.statusCipFa,
      ]
    );

    const assetId = result.insertId;
    const filePrefix = sanitizeFilename(assetData.numeroEtiqueta);
    const savedFiles = {
      pictures: [],
      pedimento: null,
      factura: null,
    };

    // Save asset pictures
    for (let i = 0; i < assetPictures.length; i++) {
      const picture = assetPictures[i];
      if (picture && picture.size > 0) {
        const ext = getFileExtension(picture.name);
        const filename = `${filePrefix}_${i + 1}.${ext}`;
        const savedPath = await saveFile(picture, 'pictures', filename);
        savedFiles.pictures.push(savedPath);
      }
    }

    // Save pedimento PDF
    if (pedimentoFile && pedimentoFile.size > 0) {
      const ext = getFileExtension(pedimentoFile.name);
      const filename = `${filePrefix}_pedimento.${ext}`;
      savedFiles.pedimento = await saveFile(pedimentoFile, 'pedimentos', filename);
    }

    // Save factura PDF
    if (facturaFile && facturaFile.size > 0) {
      const ext = getFileExtension(facturaFile.name);
      const filename = `${filePrefix}_factura.${ext}`;
      savedFiles.factura = await saveFile(facturaFile, 'facturas', filename);
    }

    console.log('Files saved:', savedFiles);

    return NextResponse.json({
      success: true,
      message: 'Activo creado exitosamente',
      data: {
        id: assetId,
        ...assetData,
        files: savedFiles,
      },
    });
  } catch (error) {
    console.error('Error creating asset:', error);
    
    // Check for duplicate entry error
    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json(
        { success: false, message: 'El número de etiqueta ya existe' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, message: 'Error al crear el activo', error: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const results = await query(`
      SELECT a.*, 
        t.nombre as tipo_nombre,
        u.nombre as ubicacion_nombre,
        p.nombre as planta_nombre
      FROM activos a
      LEFT JOIN tipos t ON a.tipo_id = t.id
      LEFT JOIN ubicaciones u ON a.ubicacion_id = u.id
      LEFT JOIN plantas p ON a.planta_id = p.id
      ORDER BY a.id DESC
    `);
    
    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error('Error fetching assets:', error);
    return NextResponse.json(
      { success: false, message: 'Error al obtener los activos', error: error.message },
      { status: 500 }
    );
  }
}
