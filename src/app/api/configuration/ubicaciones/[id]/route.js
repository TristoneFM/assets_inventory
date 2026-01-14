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

    await query('UPDATE ubicaciones SET activo = FALSE WHERE id = ?', [id]);

    return NextResponse.json({
      success: true,
      message: 'Ubicación eliminada exitosamente',
    });
  } catch (error) {
    console.error('Error deleting ubicacion:', error);
    return NextResponse.json(
      { success: false, message: 'Error al eliminar ubicación', error: error.message },
      { status: 500 }
    );
  }
}
