const { pool } = require('../src/config/database');

/**
 * Script para asignar un administrador a una biblioteca
 * Uso: node scripts/assign-admin-to-library.js <admin_email> <biblioteca_id>
 */

async function asignarAdminABiblioteca(adminEmail, bibliotecaId) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Verificar que el admin existe y tiene rol de admin
    const adminResult = await client.query(
      'SELECT id FROM usuarios WHERE email = $1 AND rol_id = (SELECT id FROM roles WHERE name = $2)',
      [adminEmail, 'admin']
    );
    
    if (adminResult.rows.length === 0) {
      throw new Error(`No se encontró un administrador con email ${adminEmail}`);
    }
    
    const adminId = adminResult.rows[0].id;
    
    // Verificar que la biblioteca existe
    const bibliotecaResult = await client.query(
      'SELECT id, nombre FROM bibliotecas WHERE id = $1',
      [bibliotecaId]
    );
    
    if (bibliotecaResult.rows.length === 0) {
      throw new Error(`No se encontró una biblioteca con ID ${bibliotecaId}`);
    }
    
    const biblioteca = bibliotecaResult.rows[0];
    
    // Verificar si ya tiene una biblioteca asignada
    const existingAssignment = await client.query(
      'SELECT biblioteca_id FROM usuario_biblioteca WHERE usuario_id = $1',
      [adminId]
    );
    
    if (existingAssignment.rows.length > 0) {
      console.log(`⚠️  El administrador ${adminEmail} ya tiene asignada la biblioteca ID ${existingAssignment.rows[0].biblioteca_id}`);
      console.log('¿Deseas reasignar? (y/N)');
      
      // En un entorno real, aquí podrías usar readline para confirmar
      // Por ahora, simplemente actualizamos
      await client.query(
        'UPDATE usuario_biblioteca SET biblioteca_id = $1 WHERE usuario_id = $2',
        [bibliotecaId, adminId]
      );
      
      console.log(`✅ Administrador ${adminEmail} reasignado a biblioteca "${biblioteca.nombre}" (ID: ${bibliotecaId})`);
    } else {
      // Crear nueva asignación
      await client.query(
        'INSERT INTO usuario_biblioteca (usuario_id, biblioteca_id) VALUES ($1, $2)',
        [adminId, bibliotecaId]
      );
      
      console.log(`✅ Administrador ${adminEmail} asignado a biblioteca "${biblioteca.nombre}" (ID: ${bibliotecaId})`);
    }
    
    await client.query('COMMIT');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error asignando administrador a biblioteca:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

async function listarBibliotecas() {
  try {
    const result = await pool.query(`
      SELECT b.id, b.nombre, b.direccion, c.nombre as colegio_nombre
      FROM bibliotecas b
      JOIN colegios c ON c.id = b.colegio_id
      ORDER BY b.id
    `);
    
    console.log('\n📚 Bibliotecas disponibles:');
    console.log('ID | Nombre | Institución');
    console.log('---|--------|-------------');
    result.rows.forEach(biblio => {
      console.log(`${biblio.id.toString().padEnd(2)} | ${biblio.nombre.padEnd(20)} | ${biblio.colegio_nombre}`);
    });
    
  } catch (error) {
    console.error('❌ Error listando bibliotecas:', error.message);
  }
}

async function listarAdmins() {
  try {
    const result = await pool.query(`
      SELECT u.id, u.nombre, u.email, u.rol_id, r.name as rol_name
      FROM usuarios u
      JOIN roles r ON r.id = u.rol_id
      WHERE r.name = 'admin'
      ORDER BY u.id
    `);
    
    console.log('\n👥 Administradores disponibles:');
    console.log('ID | Nombre | Email | Rol');
    console.log('---|--------|-------|-----');
    result.rows.forEach(admin => {
      console.log(`${admin.id.toString().padEnd(2)} | ${admin.nombre.padEnd(15)} | ${admin.email.padEnd(20)} | ${admin.rol_name}`);
    });
    
  } catch (error) {
    console.error('❌ Error listando administradores:', error.message);
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    console.log(`
📚 Script de Asignación de Administradores a Bibliotecas

Uso:
  node scripts/assign-admin-to-library.js <admin_email> <biblioteca_id>
  node scripts/assign-admin-to-library.js --list-bibliotecas
  node scripts/assign-admin-to-library.js --list-admins

Ejemplos:
  node scripts/assign-admin-to-library.js admin@ejemplo.com 1
  node scripts/assign-admin-to-library.js --list-bibliotecas
  node scripts/assign-admin-to-library.js --list-admins
    `);
    return;
  }
  
  if (args[0] === '--list-bibliotecas') {
    await listarBibliotecas();
    return;
  }
  
  if (args[0] === '--list-admins') {
    await listarAdmins();
    return;
  }
  
  if (args.length < 2) {
    console.error('❌ Error: Se requieren admin_email y biblioteca_id');
    console.log('Usa --help para ver la ayuda');
    process.exit(1);
  }
  
  const [adminEmail, bibliotecaId] = args;
  
  try {
    await asignarAdminABiblioteca(adminEmail, parseInt(bibliotecaId));
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main();
}

module.exports = {
  asignarAdminABiblioteca,
  listarBibliotecas,
  listarAdmins
};
