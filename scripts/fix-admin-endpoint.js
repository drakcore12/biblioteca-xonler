const express = require('express');
const { pool } = require('../src/config/database');

const app = express();
const PORT = 3001;

app.use(express.json());

// Endpoint para corregir el rol de administrador
app.post('/fix-admin', async (req, res) => {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Iniciando corrección de rol de administrador...');
    
    // 1. Actualizar el rol del usuario a admin
    const updateRoleQuery = `
      UPDATE usuarios 
      SET rol_id = (SELECT id FROM roles WHERE name = 'admin')
      WHERE email = 'luiseduardo13@gmail.com'
      RETURNING id, nombre, email;
    `;
    
    const roleResult = await client.query(updateRoleQuery);
    
    if (roleResult.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    console.log('✅ Rol actualizado:', roleResult.rows[0]);
    
    // 2. Asignar el usuario a una biblioteca (usando la primera biblioteca disponible)
    const assignLibraryQuery = `
      INSERT INTO usuario_biblioteca (usuario_id, biblioteca_id)
      VALUES ($1, 1)
      ON CONFLICT (usuario_id) DO UPDATE SET biblioteca_id = EXCLUDED.biblioteca_id
      RETURNING *;
    `;
    
    const libraryResult = await client.query(assignLibraryQuery, [roleResult.rows[0].id]);
    console.log('✅ Usuario asignado a biblioteca:', libraryResult.rows[0]);
    
    // 3. Verificar la configuración final
    const verifyQuery = `
      SELECT 
        u.id, u.nombre, u.email, r.name as role,
        b.nombre as biblioteca_nombre, b.id as biblioteca_id
      FROM usuarios u 
      JOIN roles r ON u.rol_id = r.id
      LEFT JOIN usuario_biblioteca ub ON ub.usuario_id = u.id
      LEFT JOIN bibliotecas b ON b.id = ub.biblioteca_id
      WHERE u.email = 'luiseduardo13@gmail.com';
    `;
    
    const verifyResult = await client.query(verifyQuery);
    console.log('✅ Configuración final:', verifyResult.rows[0]);
    
    res.json({
      success: true,
      message: 'Rol de administrador corregido exitosamente',
      user: verifyResult.rows[0]
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

app.listen(PORT, () => {
  console.log(`🔧 Servidor de corrección ejecutándose en puerto ${PORT}`);
  console.log('Envía una petición POST a http://localhost:3001/fix-admin para corregir el rol');
});
