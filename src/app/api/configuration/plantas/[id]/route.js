import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function DELETE(request, { params }) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'ID es requerido' },
        { status: 400 }
      );
    }

    await query('UPDATE plantas SET activo = FALSE WHERE id = ?', [id]);

    return NextResponse.json({
      success: true,
      message: 'Planta eliminada exitosamente',
    });
  } catch (error) {
    console.error('Error deleting planta:', error);
    return NextResponse.json(
      { success: false, message: 'Error al eliminar planta', error: error.message },
      { status: 500 }
    );
  }
}
