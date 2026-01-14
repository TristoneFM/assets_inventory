import { NextResponse } from 'next/server';
import { queryEmpleados } from '@/lib/dbEmpleados';

export async function POST(request) {
  try {
    const { usuario, contraseña } = await request.json();

    if (!usuario || !contraseña) {
      return NextResponse.json(
        { success: false, error: 'Usuario y contraseña son requeridos' },
        { status: 400 }
      );
    }

    // Convert password to number (since emp_id is likely a number)
    const empId = parseInt(contraseña);
    
    if (isNaN(empId)) {
      return NextResponse.json(
        { success: false, error: 'Contraseña inválida' },
        { status: 400 }
      );
    }

    // Authenticate user: check if emp_alias matches usuario and emp_id matches contraseña (from empleados database)
    const empleados = await queryEmpleados(
      `SELECT emp_id, emp_alias 
       FROM del_empleados 
       WHERE emp_alias = ? AND emp_id = ?
       LIMIT 1`,
      [usuario, empId]
    );

    if (!empleados || empleados.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Usuario o contraseña incorrectos' },
        { status: 401 }
      );
    }

    // Return user data (without sensitive information)
    return NextResponse.json({
      success: true,
      data: {
        emp_id: empleados[0].emp_id,
        emp_alias: empleados[0].emp_alias,
      },
    });
  } catch (error) {
    console.error('Error during login:', error);
    return NextResponse.json(
      { success: false, error: 'Error al iniciar sesión' },
      { status: 500 }
    );
  }
}

