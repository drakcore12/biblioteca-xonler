/**
 * Utilidades para construcción de queries SQL dinámicos
 * Elimina duplicación de código para filtros y paginación
 */

/**
 * Construye una cláusula WHERE dinámica con parámetros
 */
class QueryBuilder {
  constructor(baseQuery = '') {
    this.baseQuery = baseQuery;
    this.whereConditions = [];
    this.params = [];
    this.paramIndex = 1;
  }

  /**
   * Agrega una condición WHERE
   */
  where(condition, value, operator = '=') {
    if (value === undefined || value === null || value === '') {
      return this;
    }

    if (operator === 'ILIKE') {
      this.whereConditions.push(`${condition} ILIKE $${this.paramIndex}`);
      this.params.push(`%${value}%`);
    } else if (operator === 'IN') {
      if (Array.isArray(value) && value.length > 0) {
        const placeholders = value.map((_, i) => `$${this.paramIndex + i}`).join(', ');
        this.whereConditions.push(`${condition} IN (${placeholders})`);
        this.params.push(...value);
        this.paramIndex += value.length - 1;
      }
    } else {
      this.whereConditions.push(`${condition} ${operator} $${this.paramIndex}`);
      this.params.push(value);
    }

    this.paramIndex++;
    return this;
  }

  /**
   * Agrega una condición WHERE personalizada
   */
  whereRaw(condition, ...values) {
    if (values.length === 0) {
      this.whereConditions.push(condition);
    } else {
      // Reemplazar placeholders ? con parámetros numerados
      let placeholderIndex = this.paramIndex;
      const customCondition = condition.replace(/\?/g, () => { // NOSONAR S7781: replace() con callback es necesario para reemplazos dinámicos de placeholders
        const placeholder = `$${placeholderIndex}`;
        placeholderIndex++;
        return placeholder;
      });
      this.whereConditions.push(customCondition);
      this.params.push(...values);
      this.paramIndex = placeholderIndex;
    }
    return this;
  }

  /**
   * Agrega ORDER BY
   */
  orderBy(column, direction = 'ASC') {
    this.orderByClause = `ORDER BY ${column} ${direction.toUpperCase()}`;
    return this;
  }

  /**
   * Agrega LIMIT y OFFSET
   */
  paginate(limit = 50, offset = 0) {
    this.limit = Math.max(1, Number.parseInt(limit, 10));
    this.offset = Math.max(0, Number.parseInt(offset, 10));
    return this;
  }

  /**
   * Construye la query final
   */
  build() {
    let query = this.baseQuery;

    if (this.whereConditions.length > 0) {
      const whereClause = this.whereConditions.join(' AND ');
      query += ` WHERE ${whereClause}`;
    }

    if (this.orderByClause) {
      query += ` ${this.orderByClause}`;
    }

    if (this.limit !== undefined) {
      query += ` LIMIT $${this.paramIndex}`;
      this.params.push(this.limit);
      this.paramIndex++;
    }

    if (this.offset !== undefined && this.offset > 0) {
      query += ` OFFSET $${this.paramIndex}`;
      this.params.push(this.offset);
    }

    return {
      query,
      params: this.params
    };
  }

  /**
   * Construye una query COUNT para paginación
   */
  buildCount() {
    // NOSONAR S7781: replace() con regex es necesario para transformar SELECT ... FROM a SELECT COUNT(*) FROM
    let countQuery = this.baseQuery.replace(/SELECT.*FROM/i, 'SELECT COUNT(*) FROM');

    if (this.whereConditions.length > 0) {
      const whereClause = this.whereConditions.join(' AND ');
      countQuery += ` WHERE ${whereClause}`;
    }

    return {
      query: countQuery,
      params: this.params.slice(0, -2) // Excluir LIMIT y OFFSET
    };
  }
}

/**
 * Helper para construir queries de forma más simple
 */
function buildQuery(baseQuery, filters = {}, options = {}) {
  const builder = new QueryBuilder(baseQuery);

  // Aplicar filtros
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== '') {
      builder.where(key, value, options.operators?.[key] || '=');
    }
  }

  // Aplicar ordenamiento
  if (options.orderBy) {
    builder.orderBy(options.orderBy, options.orderDirection || 'ASC');
  }

  // Aplicar paginación
  if (options.limit !== undefined || options.offset !== undefined) {
    builder.paginate(options.limit || 50, options.offset || 0);
  }

  return builder;
}

/**
 * Genera SQL para calcular disponibilidad de un ejemplar
 * @param {string} alias - Alias de la tabla biblioteca_libros (default: 'bl')
 * @returns {string} - SQL CASE statement para disponibilidad
 */
function getDisponibilidadSQL(alias = 'bl') {
  return `CASE 
    WHEN EXISTS (
      SELECT 1 FROM prestamos p 
      WHERE p.biblioteca_libro_id = ${alias}.id 
      AND p.fecha_devolucion IS NULL
    ) THEN false
    ELSE true
  END as disponible`;
}

module.exports = {
  QueryBuilder,
  buildQuery,
  getDisponibilidadSQL
};

