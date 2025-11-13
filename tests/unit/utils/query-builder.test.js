const { QueryBuilder } = require('../../../src/utils/query-builder');

describe('QueryBuilder', () => {
  let builder;

  beforeEach(() => {
    builder = new QueryBuilder('SELECT * FROM libros');
  });

  describe('constructor', () => {
    test('debe inicializar con query base', () => {
      expect(builder.baseQuery).toBe('SELECT * FROM libros');
      expect(builder.whereConditions).toEqual([]);
      expect(builder.params).toEqual([]);
      expect(builder.paramIndex).toBe(1);
    });
  });

  describe('where', () => {
    test('debe agregar condición WHERE simple', () => {
      builder.where('titulo', 'Test');
      
      expect(builder.whereConditions).toContain('titulo = $1');
      expect(builder.params).toContain('Test');
    });

    test('debe ignorar valores null/undefined/vacíos', () => {
      builder.where('titulo', null);
      builder.where('autor', undefined);
      builder.where('isbn', '');
      
      expect(builder.whereConditions).toHaveLength(0);
    });

    test('debe soportar operador ILIKE', () => {
      builder.where('titulo', 'test', 'ILIKE');
      
      expect(builder.whereConditions[0]).toContain('ILIKE');
      expect(builder.params[0]).toBe('%test%');
    });

    test('debe soportar operador IN con array', () => {
      builder.where('categoria', ['A', 'B'], 'IN');
      
      expect(builder.whereConditions[0]).toContain('IN');
      expect(builder.params).toEqual(['A', 'B']);
    });

    test('debe ignorar array vacío en IN', () => {
      builder.where('categoria', [], 'IN');
      expect(builder.whereConditions).toHaveLength(0);
    });
  });

  describe('whereRaw', () => {
    test('debe agregar condición raw sin parámetros', () => {
      builder.whereRaw('created_at > NOW() - INTERVAL \'1 day\'');
      
      expect(builder.whereConditions).toContain('created_at > NOW() - INTERVAL \'1 day\'');
    });

    test('debe reemplazar placeholders ? con parámetros numerados', () => {
      builder.whereRaw('id = ? AND status = ?', 1, 'active');
      
      expect(builder.whereConditions[0]).toContain('$1');
      expect(builder.whereConditions[0]).toContain('$2');
      expect(builder.params).toEqual([1, 'active']);
    });
  });

  describe('orderBy', () => {
    test('debe agregar ORDER BY', () => {
      builder.orderBy('titulo', 'ASC');
      expect(builder.orderByClause).toBe('ORDER BY titulo ASC');
    });

    test('debe usar ASC por defecto', () => {
      builder.orderBy('titulo');
      expect(builder.orderByClause).toBe('ORDER BY titulo ASC');
    });
  });

  describe('paginate', () => {
    test('debe establecer limit y offset', () => {
      builder.paginate(10, 20);
      
      expect(builder.limit).toBe(10);
      expect(builder.offset).toBe(20);
    });

    test('debe validar limit mínimo', () => {
      builder.paginate(0, 0);
      expect(builder.limit).toBe(1);
    });

    test('debe validar offset mínimo', () => {
      builder.paginate(10, -5);
      expect(builder.offset).toBe(0);
    });
  });

  describe('build', () => {
    test('debe construir query completa', () => {
      builder
        .where('titulo', 'Test')
        .orderBy('titulo', 'ASC')
        .paginate(10, 0);
      
      const query = builder.build();
      
      expect(query.query).toContain('SELECT * FROM libros');
      expect(query.query).toContain('WHERE');
      expect(query.query).toContain('ORDER BY');
      expect(query.query).toContain('LIMIT');
      expect(query.params).toContain('Test');
      expect(query.params).toContain(10);
    });

    test('debe construir query sin WHERE si no hay condiciones', () => {
      builder.orderBy('titulo').paginate(10, 0);
      
      const query = builder.build();
      expect(query.query).not.toContain('WHERE');
    });
  });
});

