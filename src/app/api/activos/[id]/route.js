import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request, { params }) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'ID es requerido' },
        { status: 400 }
      );
    }

    const results = await query(
      `SELECT a.*, 
        t.nombre as tipo_nombre,
        u.nombre as ubicacion_nombre,
        p.nombre as planta_nombre
      FROM activos a
      LEFT JOIN tipos t ON a.tipo_id = t.id
      LEFT JOIN ubicaciones u ON a.ubicacion_id = u.id
      LEFT JOIN plantas p ON a.planta_id = p.id
      WHERE a.id = ?`,
      [id]
    );

    if (results.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Activo no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: results[0],
    });
  } catch (error) {
    console.error('Error fetching activo:', error);
    return NextResponse.json(
      { success: false, message: 'Error al obtener el activo', error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'ID es requerido' },
        { status: 400 }
      );
    }

    const {
      numeroActivo,
      numeroEtiqueta,
      tipo_id,
      marca,
      modelo,
      serie,
      ubicacion_id,
      planta_id,
      nacionalExtranjero,
      numeroPedimento,
      status,
      numeroCapex,
      ordenInterna,
      observaciones,
      statusCipFa,
    } = body;

    await query(
      `UPDATE activos SET 
        numeroActivo = ?,
        numeroEtiqueta = ?,
        tipo_id = ?,
        marca = ?,
        modelo = ?,
        serie = ?,
        ubicacion_id = ?,
        planta_id = ?,
        nacionalExtranjero = ?,
        numeroPedimento = ?,
        status = ?,
        numeroCapex = ?,
        ordenInterna = ?,
        observaciones = ?,
        statusCipFa = ?
      WHERE id = ?`,
      [
        numeroActivo,
        numeroEtiqueta,
        tipo_id,
        marca,
        modelo,
        serie || null,
        ubicacion_id,
        planta_id,
        nacionalExtranjero,
        numeroPedimento || null,
        status || 'activo',
        numeroCapex || null,
        ordenInterna || null,
        observaciones || null,
        statusCipFa || null,
        id,
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'Activo actualizado exitosamente',
    });
  } catch (error) {
    console.error('Error updating activo:', error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json(
        { success: false, message: 'El número de etiqueta ya existe' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, message: 'Error al actualizar el activo', error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'ID es requerido' },
        { status: 400 }
      );
    }

    // Get userBaja from request body if provided
    let userBaja = null;
    try {
      const body = await request.json();
      userBaja = body.userBaja || null;
    } catch {
      // No body provided, continue without userBaja
    }

    // Soft delete: change status to 'baja', set fechaBaja and userBaja
    await query(
      'UPDATE activos SET status = ?, fechaBaja = CURDATE(), userBaja = ? WHERE id = ?',
      ['baja', userBaja, id]
    );

    return NextResponse.json({
      success: true,
      message: 'Activo dado de baja exitosamente',
    });
  } catch (error) {
    console.error('Error deleting activo:', error);
    return NextResponse.json(
      { success: false, message: 'Error al dar de baja el activo', error: error.message },
      { status: 500 }
    );
  }
}

