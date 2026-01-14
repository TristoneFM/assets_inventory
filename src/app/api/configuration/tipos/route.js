import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const results = await query('SELECT * FROM tipos WHERE activo = TRUE ORDER BY nombre');
    
    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error('Error fetching tipos:', error);
    return NextResponse.json(
      { success: false, message: 'Error al obtener tipos', error: error.message },
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
      'INSERT INTO tipos (nombre, descripcion) VALUES (?, ?)',
      [nombre.trim(), descripcion?.trim() || null]
    );

    return NextResponse.json({
      success: true,
      message: 'Tipo creado exitosamente',
      data: { id: result.insertId, nombre, descripcion },
    });
  } catch (error) {
    console.error('Error creating tipo:', error);
    return NextResponse.json(
      { success: false, message: 'Error al crear tipo', error: error.message },
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
      'UPDATE tipos SET nombre = ?, descripcion = ? WHERE id = ?',
      [nombre.trim(), descripcion?.trim() || null, id]
    );

    return NextResponse.json({
      success: true,
      message: 'Tipo actualizado exitosamente',
    });
  } catch (error) {
    console.error('Error updating tipo:', error);
    return NextResponse.json(
      { success: false, message: 'Error al actualizar tipo', error: error.message },
      { status: 500 }
    );
  }
}
