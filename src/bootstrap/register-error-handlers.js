function registerErrorHandlers(app) {
   
  app.use((err, req, res, next) => {
    console.error('❌ Error no manejado:', err);
    if (res.headersSent) {
      return next(err);
    }

    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
      return res.status(400).json({ error: 'JSON inválido en el body' });
    }

    if (err.code === '23505') {
      return res.status(409).json({ error: 'Conflicto: el recurso ya existe' });
    }

    if (err.code === '23503') {
      return res.status(400).json({ error: 'Referencia inválida' });
    }

    return res.status(500).json({ error: 'Error interno del servidor' });
  });

  app.use((req, res) => {
    res.status(404).json({ error: 'No encontrado' });
  });
}

module.exports = { registerErrorHandlers };
