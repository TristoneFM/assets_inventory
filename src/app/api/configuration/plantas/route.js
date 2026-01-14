import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const results = await query('SELECT * FROM plantas WHERE activo = TRUE ORDER BY nombre');
    
    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error('Error fetching plantas:', error);
    return NextResponse.json(
      { success: false, message: 'Error al obtener plantas', error: error.message },
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
      'INSERT INTO plantas (nombre, descripcion) VALUES (?, ?)',
      [nombre.trim(), descripcion?.trim() || null]
    );

    return NextResponse.json({
      success: true,
      message: 'Planta creada exitosamente',
      data: { id: result.insertId, nombre, descripcion },
    });
  } catch (error) {
    console.error('Error creating planta:', error);
    return NextResponse.json(
      { success: false, message: 'Error al crear planta', error: error.message },
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
      'UPDATE plantas SET nombre = ?, descripcion = ? WHERE id = ?',
      [nombre.trim(), descripcion?.trim() || null, id]
    );

    return NextResponse.json({
      success: true,
      message: 'Planta actualizada exitosamente',
    });
  } catch (error) {
    console.error('Error updating planta:', error);
    return NextResponse.json(
      { success: false, message: 'Error al actualizar planta', error: error.message },
      { status: 500 }
    );
  }
}
