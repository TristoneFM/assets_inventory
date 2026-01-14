import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const results = await query('SELECT * FROM ubicaciones WHERE activo = TRUE ORDER BY nombre');
    
    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error('Error fetching ubicaciones:', error);
    return NextResponse.json(
      { success: false, message: 'Error al obtener ubicaciones', error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const { nombre, descripcion } = await request.json();

    if (!nombre || !nombre.trim()) {
      return NextResponse.json(
        { success: false, message: 'El nombre es requerido' },
        { status: 400 }
      );
    }

    const result = await query(
      'INSERT INTO ubicaciones (nombre, descripcion) VALUES (?, ?)',
      [nombre.trim(), descripcion?.trim() || null]
    );

    return NextResponse.json({
      success: true,
      message: 'Ubicación creada exitosamente',
      data: { id: result.insertId, nombre, descripcion },
    });
  } catch (error) {
    console.error('Error creating ubicacion:', error);
    return NextResponse.json(
      { success: false, message: 'Error al crear ubicación', error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const { id, nombre, descripcion } = await request.json();

    if (!id || !nombre || !nombre.trim()) {
      return NextResponse.json(
        { success: false, message: 'ID y nombre son requeridos' },
        { status: 400 }
      );
    }

    await query(
      'UPDATE ubicaciones SET nombre = ?, descripcion = ? WHERE id = ?',
      [nombre.trim(), descripcion?.trim() || null, id]
    );

    return NextResponse.json({
      success: true,
      message: 'Ubicación actualizada exitosamente',
    });
  } catch (error) {
    console.error('Error updating ubicacion:', error);
    return NextResponse.json(
      { success: false, message: 'Error al actualizar ubicación', error: error.message },
      { status: 500 }
    );
  }
}
