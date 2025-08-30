--
-- PostgreSQL database dump
--

\restrict oLsWrUCzQjQgTkwgpmdhwojbjoifjgPeYdd5zPNl4VEBvncLVijghP3lt3RCLcf

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

-- Started on 2025-08-29 23:23:22

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 6 (class 2615 OID 2200)
-- Name: public; Type: SCHEMA; Schema: -; Owner: pg_database_owner
--

CREATE SCHEMA public;


ALTER SCHEMA public OWNER TO pg_database_owner;

--
-- TOC entry 5011 (class 0 OID 0)
-- Dependencies: 6
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: pg_database_owner
--

COMMENT ON SCHEMA public IS 'standard public schema';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 230 (class 1259 OID 16716)
-- Name: biblioteca_libros; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.biblioteca_libros (
    id bigint NOT NULL,
    biblioteca_id bigint NOT NULL,
    libro_id bigint NOT NULL
);


ALTER TABLE public.biblioteca_libros OWNER TO postgres;

--
-- TOC entry 229 (class 1259 OID 16715)
-- Name: biblioteca_libros_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.biblioteca_libros ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.biblioteca_libros_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 226 (class 1259 OID 16691)
-- Name: bibliotecas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.bibliotecas (
    id bigint NOT NULL,
    nombre text NOT NULL,
    direccion text,
    colegio_id bigint NOT NULL
);


ALTER TABLE public.bibliotecas OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 16690)
-- Name: bibliotecas_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.bibliotecas ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.bibliotecas_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 224 (class 1259 OID 16683)
-- Name: colegios; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.colegios (
    id bigint NOT NULL,
    nombre text NOT NULL,
    direccion text
);


ALTER TABLE public.colegios OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 16682)
-- Name: colegios_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.colegios ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.colegios_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 228 (class 1259 OID 16704)
-- Name: libros; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.libros (
    id bigint NOT NULL,
    titulo text NOT NULL,
    autor text NOT NULL,
    isbn text,
    imagen_url text,
    descripcion text,
    categoria text DEFAULT 'Otros'::text,
    disponibilidad boolean DEFAULT true
);


ALTER TABLE public.libros OWNER TO postgres;

--
-- TOC entry 227 (class 1259 OID 16703)
-- Name: libros_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.libros ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.libros_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 232 (class 1259 OID 16734)
-- Name: prestamos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.prestamos (
    id bigint NOT NULL,
    usuario_id bigint NOT NULL,
    biblioteca_libro_id bigint NOT NULL,
    fecha_prestamo date NOT NULL,
    fecha_devolucion date
);


ALTER TABLE public.prestamos OWNER TO postgres;

--
-- TOC entry 231 (class 1259 OID 16733)
-- Name: prestamos_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.prestamos ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.prestamos_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 220 (class 1259 OID 16660)
-- Name: roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.roles (
    id bigint NOT NULL,
    name text NOT NULL
);


ALTER TABLE public.roles OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 16659)
-- Name: roles_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.roles ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.roles_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 222 (class 1259 OID 16668)
-- Name: usuarios; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.usuarios (
    id bigint NOT NULL,
    nombre text NOT NULL,
    email text NOT NULL,
    password_hash text NOT NULL,
    rol_id bigint NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    telefono text,
    fecha_nacimiento date,
    genero text,
    direccion text,
    ciudad text,
    codigo_postal text,
    apellido text,
    preferencias jsonb DEFAULT '{}'::jsonb NOT NULL
);


ALTER TABLE public.usuarios OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 16667)
-- Name: usuarios_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.usuarios ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.usuarios_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 5003 (class 0 OID 16716)
-- Dependencies: 230
-- Data for Name: biblioteca_libros; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.biblioteca_libros OVERRIDING SYSTEM VALUE VALUES (1, 1, 1);
INSERT INTO public.biblioteca_libros OVERRIDING SYSTEM VALUE VALUES (2, 1, 2);
INSERT INTO public.biblioteca_libros OVERRIDING SYSTEM VALUE VALUES (3, 1, 3);
INSERT INTO public.biblioteca_libros OVERRIDING SYSTEM VALUE VALUES (4, 1, 4);
INSERT INTO public.biblioteca_libros OVERRIDING SYSTEM VALUE VALUES (5, 1, 5);
INSERT INTO public.biblioteca_libros OVERRIDING SYSTEM VALUE VALUES (6, 1, 6);
INSERT INTO public.biblioteca_libros OVERRIDING SYSTEM VALUE VALUES (7, 2, 7);
INSERT INTO public.biblioteca_libros OVERRIDING SYSTEM VALUE VALUES (8, 2, 8);
INSERT INTO public.biblioteca_libros OVERRIDING SYSTEM VALUE VALUES (9, 2, 9);
INSERT INTO public.biblioteca_libros OVERRIDING SYSTEM VALUE VALUES (10, 2, 10);
INSERT INTO public.biblioteca_libros OVERRIDING SYSTEM VALUE VALUES (11, 2, 11);
INSERT INTO public.biblioteca_libros OVERRIDING SYSTEM VALUE VALUES (12, 2, 12);
INSERT INTO public.biblioteca_libros OVERRIDING SYSTEM VALUE VALUES (13, 3, 13);
INSERT INTO public.biblioteca_libros OVERRIDING SYSTEM VALUE VALUES (14, 3, 14);
INSERT INTO public.biblioteca_libros OVERRIDING SYSTEM VALUE VALUES (15, 3, 15);
INSERT INTO public.biblioteca_libros OVERRIDING SYSTEM VALUE VALUES (16, 3, 16);
INSERT INTO public.biblioteca_libros OVERRIDING SYSTEM VALUE VALUES (17, 3, 17);
INSERT INTO public.biblioteca_libros OVERRIDING SYSTEM VALUE VALUES (18, 3, 18);
INSERT INTO public.biblioteca_libros OVERRIDING SYSTEM VALUE VALUES (19, 4, 19);
INSERT INTO public.biblioteca_libros OVERRIDING SYSTEM VALUE VALUES (20, 4, 20);
INSERT INTO public.biblioteca_libros OVERRIDING SYSTEM VALUE VALUES (21, 4, 21);
INSERT INTO public.biblioteca_libros OVERRIDING SYSTEM VALUE VALUES (22, 4, 22);
INSERT INTO public.biblioteca_libros OVERRIDING SYSTEM VALUE VALUES (23, 4, 23);
INSERT INTO public.biblioteca_libros OVERRIDING SYSTEM VALUE VALUES (24, 4, 24);
INSERT INTO public.biblioteca_libros OVERRIDING SYSTEM VALUE VALUES (25, 5, 25);
INSERT INTO public.biblioteca_libros OVERRIDING SYSTEM VALUE VALUES (26, 5, 26);
INSERT INTO public.biblioteca_libros OVERRIDING SYSTEM VALUE VALUES (27, 5, 27);
INSERT INTO public.biblioteca_libros OVERRIDING SYSTEM VALUE VALUES (28, 5, 28);
INSERT INTO public.biblioteca_libros OVERRIDING SYSTEM VALUE VALUES (29, 5, 29);
INSERT INTO public.biblioteca_libros OVERRIDING SYSTEM VALUE VALUES (30, 5, 30);


--
-- TOC entry 4999 (class 0 OID 16691)
-- Dependencies: 226
-- Data for Name: bibliotecas; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.bibliotecas OVERRIDING SYSTEM VALUE VALUES (1, 'Biblioteca Central UdeA', 'Calle 67 #53-108, Bloque B', 1);
INSERT INTO public.bibliotecas OVERRIDING SYSTEM VALUE VALUES (2, 'Biblioteca Luis Echavarría Villegas (EAFIT)', 'Carrera 49 #7 Sur-50, Ed. 47A', 2);
INSERT INTO public.bibliotecas OVERRIDING SYSTEM VALUE VALUES (3, 'Biblioteca PoliJaime', 'Carrera 65 #59A-110, Sótano 1', 3);
INSERT INTO public.bibliotecas OVERRIDING SYSTEM VALUE VALUES (4, 'Biblioteca Pública Piloto', 'Calle 53 #48-23', 4);
INSERT INTO public.bibliotecas OVERRIDING SYSTEM VALUE VALUES (5, 'Biblioteca El Salvador', 'Transversal 92 #37-25', 5);
INSERT INTO public.bibliotecas OVERRIDING SYSTEM VALUE VALUES (8, 'Biblioteca San Cristóbal', 'carrera 141#62-86', 4);


--
-- TOC entry 4997 (class 0 OID 16683)
-- Dependencies: 224
-- Data for Name: colegios; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.colegios OVERRIDING SYSTEM VALUE VALUES (1, 'Universidad de Antioquia', 'Calle 67 #53-108, Medellín');
INSERT INTO public.colegios OVERRIDING SYSTEM VALUE VALUES (2, 'Universidad EAFIT', 'Carrera 49 #7 Sur-50, Medellín');
INSERT INTO public.colegios OVERRIDING SYSTEM VALUE VALUES (3, 'Politécnico Colombiano Jaime Isaza Cadavid', 'Carrera 65 #59A-110, Medellín');
INSERT INTO public.colegios OVERRIDING SYSTEM VALUE VALUES (4, 'Biblioteca Pública Piloto', 'Calle 53 #48-23, Medellín');
INSERT INTO public.colegios OVERRIDING SYSTEM VALUE VALUES (5, 'Biblioteca Pública El Salvador', 'Transversal 92 #37-25, Medellín');
INSERT INTO public.colegios OVERRIDING SYSTEM VALUE VALUES (6, 'hola', '# 62-86 Carrera 141');


--
-- TOC entry 5001 (class 0 OID 16704)
-- Dependencies: 228
-- Data for Name: libros; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.libros OVERRIDING SYSTEM VALUE VALUES (3, 'Don Quijote de la Mancha', 'Miguel de Cervantes', '9788491050252', '/assets/images/libro-placeholder.jpg', 'Las aventuras del ingenioso hidalgo Don Quijote y su fiel escudero Sancho Panza, en clave de sátira y epopeya.', 'Literatura', false);
INSERT INTO public.libros OVERRIDING SYSTEM VALUE VALUES (7, 'Matar a un ruiseñor', 'Harper Lee', '9780061120084', '/assets/images/libro-placeholder.jpg', 'Atticus Finch defiende a un hombre negro injustamente acusado en el profundo sur americano, a través de los ojos de Scout.', 'Literatura', true);
INSERT INTO public.libros OVERRIDING SYSTEM VALUE VALUES (8, 'La Odisea', 'Homero', '9780140268867', '/assets/images/libro-placeholder.jpg', 'El héroe Odiseo navega mares llenos de monstruos y dioses para regresar a Ítaca después de la Guerra de Troya.', 'Historia', true);
INSERT INTO public.libros OVERRIDING SYSTEM VALUE VALUES (9, 'Ulises', 'James Joyce', '9780141182803', '/assets/images/libro-placeholder.jpg', 'El monólogo interior de Leopold Bloom revive las obsesiones y reflexiones de un día en la vida de un dublines.', 'Ficción', true);
INSERT INTO public.libros OVERRIDING SYSTEM VALUE VALUES (10, 'Moby Dick', 'Herman Melville', '9780142437247', '/assets/images/libro-placeholder.jpg', 'La odisea de Ahab en busca de la gran ballena blanca que le arrebató una pierna, explorando la locura y la obsesión.', 'Ficción', true);
INSERT INTO public.libros OVERRIDING SYSTEM VALUE VALUES (11, 'Ana Karenina', 'León Tolstói', '9780140449174', '/assets/images/libro-placeholder.jpg', 'Anna Karenina desafía las convenciones de la nobleza rusa al embarcarse en un amor prohibido que cambiará su destino.', 'Literatura', true);
INSERT INTO public.libros OVERRIDING SYSTEM VALUE VALUES (12, 'Frankenstein', 'Mary Shelley', '9780141439471', '/assets/images/libro-placeholder.jpg', 'Víctor Frankenstein crea vida artificial, desatando consecuencias trágicas y reflexiones sobre la ambición humana.', 'Ficción', true);
INSERT INTO public.libros OVERRIDING SYSTEM VALUE VALUES (13, 'Drácula', 'Bram Stoker', '9780141439846', '/assets/images/libro-placeholder.jpg', 'El conde Drácula, un vampiro de Transilvania, siembra el terror en Londres mientras busca nuevas víctimas.', 'Ficción', true);
INSERT INTO public.libros OVERRIDING SYSTEM VALUE VALUES (14, 'El retrato de Dorian Gray', 'Oscar Wilde', '9780141439570', '/assets/images/libro-placeholder.jpg', 'Dorian Gray permanece eternamente joven mientras su retrato envejece y refleja su corrupción moral.', 'Ficción', true);
INSERT INTO public.libros OVERRIDING SYSTEM VALUE VALUES (15, 'Fahrenheit 451', 'Ray Bradbury', '9781451673319', '/assets/images/libro-placeholder.jpg', 'En un futuro en que los libros están prohibidos, Montag, un bombero, comienza a cuestionar la quemazón de la cultura escrita.', 'Ciencia', true);
INSERT INTO public.libros OVERRIDING SYSTEM VALUE VALUES (16, 'La metamorfosis', 'Franz Kafka', '9780143105244', '/assets/images/libro-placeholder.jpg', 'Gregor Samsa se transforma en un insecto gigante, explorando el absurdo y el aislamiento en la sociedad moderna.', 'Ficción', true);
INSERT INTO public.libros OVERRIDING SYSTEM VALUE VALUES (17, 'El extranjero', 'Albert Camus', '9788491050214', '/assets/images/libro-placeholder.jpg', 'Meursault, indiferente ante la vida y la muerte, enfrenta un juicio tras cometer un asesinato sin aparente motivo.', 'Ficción', true);
INSERT INTO public.libros OVERRIDING SYSTEM VALUE VALUES (18, 'Rayuela', 'Julio Cortázar', '9780307476464', '/assets/images/libro-placeholder.jpg', 'Horacio Oliveira y La Maga deambulan por París y Buenos Aires en busca de sentido y amor en un mosaic.', 'Literatura', true);
INSERT INTO public.libros OVERRIDING SYSTEM VALUE VALUES (19, 'El amor en los tiempos del cólera', 'Gabriel García Márquez', '9780307389732', '/assets/images/libro-placeholder.jpg', 'Florentino Ariza espera décadas para poder declararse a Fermina Daza, narrando un amor que perdura contra todo.', 'Literatura', true);
INSERT INTO public.libros OVERRIDING SYSTEM VALUE VALUES (20, 'La colmena', 'Camilo José Cela', '9788432214062', '/assets/images/libro-placeholder.jpg', 'Un retrato coral de la posguerra española, mostrando vidas anónimas que revelan la complejidad del alma humana.', 'Historia', true);
INSERT INTO public.libros OVERRIDING SYSTEM VALUE VALUES (21, 'Pedro Páramo', 'Juan Rulfo', '9786071603436', '/assets/images/libro-placeholder.jpg', 'Juan Preciado llega a Comala para encontrar a su padre muerto, descubriendo un pueblo poblado por fantasmas.', 'Literatura', true);
INSERT INTO public.libros OVERRIDING SYSTEM VALUE VALUES (22, 'Cándido', 'Voltaire', '9780140440049', '/assets/images/libro-placeholder.jpg', 'Cándido recorre el mundo sufriendo calamidades que ponen en duda el optimismo de Leibniz.', 'Filosofía', true);
INSERT INTO public.libros OVERRIDING SYSTEM VALUE VALUES (23, 'El sonido y la furia', 'William Faulkner', '9780679732242', '/assets/images/libro-placeholder.jpg', 'La decadente familia Compson narra su tragedia en el sur de Estados Unidos, explorando la memoria y el tiempo.', 'Literatura', true);
INSERT INTO public.libros OVERRIDING SYSTEM VALUE VALUES (24, 'Los hermanos Karamázov', 'Fiódor Dostoievski', '9780140449242', '/assets/images/libro-placeholder.jpg', 'Los tres hermanos Karamázov debaten la fe, la moral y la libertad en la Rusia de finales del siglo XIX.', 'Ficción', true);
INSERT INTO public.libros OVERRIDING SYSTEM VALUE VALUES (25, 'Crónica de una muerte anunciada', 'Gabriel García Márquez', '9780060883287', '/assets/images/libro-placeholder.jpg', 'Santiago Nasar está predestinado a morir por una afrenta familiar; García Márquez reconstruye los últimos días antes del crimen.', 'Literatura', true);
INSERT INTO public.libros OVERRIDING SYSTEM VALUE VALUES (26, 'La casa de los espíritus', 'Isabel Allende', '9780061148529', '/assets/images/libro-placeholder.jpg', 'La saga de la familia Trueba explora la historia de Chile del siglo XX entre fantasmas y política.', 'Literatura', true);
INSERT INTO public.libros OVERRIDING SYSTEM VALUE VALUES (27, 'Siddhartha', 'Hermann Hesse', '9780141189572', '/assets/images/libro-placeholder.jpg', 'Siddhartha busca la iluminación a través del viaje espiritual y el desapego en la India antigua.', 'Filosofía', true);
INSERT INTO public.libros OVERRIDING SYSTEM VALUE VALUES (28, 'Cumbres borrascosas', 'Emily Brontë', '9780141439556', '/assets/images/libro-placeholder.jpg', 'Una pareja de recién casados vive la monotonía de la alta sociedad en la Inglaterra decimonónica.', 'Literatura', true);
INSERT INTO public.libros OVERRIDING SYSTEM VALUE VALUES (29, 'Lolita', 'Vladimir Nabokov', '9780679723165', '/assets/images/libro-placeholder.jpg', 'Humbert Humbert narra su obsesiva pasión por la joven Lolita, explorando los límites de la moral.', 'Ficción', true);
INSERT INTO public.libros OVERRIDING SYSTEM VALUE VALUES (30, 'El túnel', 'Ernesto Sabato', '9780140446137', '/assets/images/libro-placeholder.jpg', 'Juan Pablo Castel obsesionado con María, causa un asesinato a los pies de un túnel olvidado.', 'Ficción', true);
INSERT INTO public.libros OVERRIDING SYSTEM VALUE VALUES (31, 'El silencio de los corderos', 'Thomas Harris', '978-8497930002', '/assets/images/1749524745498-0b2b130d-e56f-4045-8054-82b2b525481b.png', '	Una joven agente del FBI busca la ayuda de Hannibal Lecter, un brillante psiquiatra y asesino en serie, para atrapar a otro criminal.', 'Otros', true);
INSERT INTO public.libros OVERRIDING SYSTEM VALUE VALUES (32, 'Dune', 'Frank Herbert', '978-0441172719', '/assets/images/1749524902161-images.jpeg', 'Una epopeya interplanetaria sobre política, ecología y destino en el árido planeta Arrakis.', 'Otros', true);
INSERT INTO public.libros OVERRIDING SYSTEM VALUE VALUES (2, 'Cien años de soledad', 'Gabriel García Márquez', '9780307474728', '/assets/images/libro-placeholder.jpg', 'La historia de la familia Buendía a lo largo de varias generaciones en el mítico pueblo de Macondo.', 'Literatura', false);
INSERT INTO public.libros OVERRIDING SYSTEM VALUE VALUES (1, '1984', 'George Orwell', '9780451524935', '/assets/images/libro-placeholder.jpg', 'Una distopía clásica en la que Winston Smith desafía la vigilancia del Gran Hermano.', 'Ficción', false);
INSERT INTO public.libros OVERRIDING SYSTEM VALUE VALUES (4, 'El Principito', 'Antoine de Saint-Exupéry', '9788408130701', '/assets/images/libro-placeholder.jpg', 'Un niño príncipe comparte sus reflexiones sobre la vida, el amor y la amistad en su viaje interplanetario.', 'Ficción', false);
INSERT INTO public.libros OVERRIDING SYSTEM VALUE VALUES (5, 'Crimen y castigo', 'Fiódor Dostoievski', '9780140449136', '/assets/images/libro-placeholder.jpg', 'Winston Smith, en un régimen totalitario, intenta preservar su humanidad confrontando la vigilancia constante del Gran Hermano.', 'Ficción', false);
INSERT INTO public.libros OVERRIDING SYSTEM VALUE VALUES (6, 'Orgullo y prejuicio', 'Jane Austen', '9780141040349', '/assets/images/libro-placeholder.jpg', 'Elizabeth Bennet y Mr. Darcy luchan contra los prejuicios sociales y personales para encontrar el verdadero amor.', 'Literatura', false);


--
-- TOC entry 5005 (class 0 OID 16734)
-- Dependencies: 232
-- Data for Name: prestamos; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.prestamos OVERRIDING SYSTEM VALUE VALUES (1, 1, 2, '2025-06-13', NULL);
INSERT INTO public.prestamos OVERRIDING SYSTEM VALUE VALUES (2, 1, 1, '2025-06-13', NULL);
INSERT INTO public.prestamos OVERRIDING SYSTEM VALUE VALUES (3, 1, 4, '2025-06-13', NULL);
INSERT INTO public.prestamos OVERRIDING SYSTEM VALUE VALUES (4, 1, 5, '2025-06-14', NULL);
INSERT INTO public.prestamos OVERRIDING SYSTEM VALUE VALUES (5, 1, 6, '2025-06-14', NULL);


--
-- TOC entry 4993 (class 0 OID 16660)
-- Dependencies: 220
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.roles OVERRIDING SYSTEM VALUE VALUES (1, 'usuario');
INSERT INTO public.roles OVERRIDING SYSTEM VALUE VALUES (2, 'admin');
INSERT INTO public.roles OVERRIDING SYSTEM VALUE VALUES (3, 'adminAdvanced');


--
-- TOC entry 4995 (class 0 OID 16668)
-- Dependencies: 222
-- Data for Name: usuarios; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.usuarios OVERRIDING SYSTEM VALUE VALUES (1, 'Nombre Admin', 'admin@tudominio.com', '$2a$06$M8iWe/sjU76PvBCX5dI5geofu2udmLxA.rbs.cFLN6CUndfCtsY7G', 2, '2025-08-29 20:42:05.87578', '2025-08-29 21:00:07.361878', '+34 600 123 456', '1990-01-01', 'prefiero-no-decir', 'Calle Principal 123', 'Madrid', '28001', NULL, '{"tema": "auto", "idioma": "es", "appPrestamos": true, "emailEventos": false, "tamanoFuente": "medium", "maxResultados": "20", "emailPrestamos": true, "appMantenimiento": false, "emailNuevosLibros": true, "appRecomendaciones": true, "categoriasFavoritas": ["ficcion", "ciencia"]}');
INSERT INTO public.usuarios OVERRIDING SYSTEM VALUE VALUES (3, 'Admin Prueba', 'admin@prueba.com', '$2a$10$2poTYpTbFnLboPh1UqfrUep3eGbRGcCUM2LP8ZUmK1oqpbCRUOKO2', 2, '2025-08-29 20:42:05.87578', '2025-08-29 21:00:07.361878', '+34 600 123 456', '1990-01-01', 'prefiero-no-decir', 'Calle Principal 123', 'Madrid', '28001', NULL, '{"tema": "auto", "idioma": "es", "appPrestamos": true, "emailEventos": false, "tamanoFuente": "medium", "maxResultados": "20", "emailPrestamos": true, "appMantenimiento": false, "emailNuevosLibros": true, "appRecomendaciones": true, "categoriasFavoritas": ["ficcion", "ciencia"]}');
INSERT INTO public.usuarios OVERRIDING SYSTEM VALUE VALUES (4, 'william antonio monotya diaz', 'william.montoya@pascualbravo.edu.co', '$2b$10$o3irEb2hqRHFrW1sxaM4D.EJ2.yqXZutMb1pa8oOw.teb79v9zezK', 1, '2025-08-29 20:42:05.87578', '2025-08-29 21:00:07.361878', '+34 600 123 456', '1990-01-01', 'prefiero-no-decir', 'Calle Principal 123', 'Madrid', '28001', NULL, '{"tema": "auto", "idioma": "es", "appPrestamos": true, "emailEventos": false, "tamanoFuente": "medium", "maxResultados": "20", "emailPrestamos": true, "appMantenimiento": false, "emailNuevosLibros": true, "appRecomendaciones": true, "categoriasFavoritas": ["ficcion", "ciencia"]}');
INSERT INTO public.usuarios OVERRIDING SYSTEM VALUE VALUES (6, 'm', 'm@gmail.com', '$2b$10$GGUyJ1M3Pp/XLaKdi5pD3.1iZ/aHf2E3IatDeKkfEz7vtK10OqPZO', 1, '2025-08-29 20:42:05.87578', '2025-08-29 21:00:07.361878', '+34 600 123 456', '1990-01-01', 'prefiero-no-decir', 'Calle Principal 123', 'Madrid', '28001', NULL, '{"tema": "auto", "idioma": "es", "appPrestamos": true, "emailEventos": false, "tamanoFuente": "medium", "maxResultados": "20", "emailPrestamos": true, "appMantenimiento": false, "emailNuevosLibros": true, "appRecomendaciones": true, "categoriasFavoritas": ["ficcion", "ciencia"]}');
INSERT INTO public.usuarios OVERRIDING SYSTEM VALUE VALUES (2, 'miguel noreña', 'luiseduardo1913@gmail.com', '$2b$10$k2Did5sU1VTnGiQhz2vxsujF9xbx460w9YwhrzMZ9.PMNHaZLwU6m', 1, '2025-08-29 20:42:05.87578', '2025-08-29 21:59:33.913621', '3136317078', '2004-02-13', 'masculino', '# 62-86 Carrera 141', 'San Cristóbal', '050036', 'noreña', '{"tema": "auto", "idioma": "es", "appPrestamos": true, "emailEventos": false, "tamanoFuente": "medium", "maxResultados": "20", "emailPrestamos": true, "appMantenimiento": false, "emailNuevosLibros": true, "appRecomendaciones": true, "categoriasFavoritas": ["ficcion", "historia", "tecnologia"]}');


--
-- TOC entry 5012 (class 0 OID 0)
-- Dependencies: 229
-- Name: biblioteca_libros_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.biblioteca_libros_id_seq', 30, true);


--
-- TOC entry 5013 (class 0 OID 0)
-- Dependencies: 225
-- Name: bibliotecas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.bibliotecas_id_seq', 8, true);


--
-- TOC entry 5014 (class 0 OID 0)
-- Dependencies: 223
-- Name: colegios_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.colegios_id_seq', 6, true);


--
-- TOC entry 5015 (class 0 OID 0)
-- Dependencies: 227
-- Name: libros_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.libros_id_seq', 32, true);


--
-- TOC entry 5016 (class 0 OID 0)
-- Dependencies: 231
-- Name: prestamos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.prestamos_id_seq', 5, true);


--
-- TOC entry 5017 (class 0 OID 0)
-- Dependencies: 219
-- Name: roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.roles_id_seq', 3, true);


--
-- TOC entry 5018 (class 0 OID 0)
-- Dependencies: 221
-- Name: usuarios_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.usuarios_id_seq', 6, true);


--
-- TOC entry 4836 (class 2606 OID 16722)
-- Name: biblioteca_libros biblioteca_libros_biblioteca_id_libro_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.biblioteca_libros
    ADD CONSTRAINT biblioteca_libros_biblioteca_id_libro_id_key UNIQUE (biblioteca_id, libro_id);


--
-- TOC entry 4838 (class 2606 OID 16720)
-- Name: biblioteca_libros biblioteca_libros_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.biblioteca_libros
    ADD CONSTRAINT biblioteca_libros_pkey PRIMARY KEY (id);


--
-- TOC entry 4830 (class 2606 OID 16697)
-- Name: bibliotecas bibliotecas_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bibliotecas
    ADD CONSTRAINT bibliotecas_pkey PRIMARY KEY (id);


--
-- TOC entry 4828 (class 2606 OID 16689)
-- Name: colegios colegios_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.colegios
    ADD CONSTRAINT colegios_pkey PRIMARY KEY (id);


--
-- TOC entry 4832 (class 2606 OID 16714)
-- Name: libros libros_isbn_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.libros
    ADD CONSTRAINT libros_isbn_key UNIQUE (isbn);


--
-- TOC entry 4834 (class 2606 OID 16712)
-- Name: libros libros_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.libros
    ADD CONSTRAINT libros_pkey PRIMARY KEY (id);


--
-- TOC entry 4840 (class 2606 OID 16738)
-- Name: prestamos prestamos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prestamos
    ADD CONSTRAINT prestamos_pkey PRIMARY KEY (id);


--
-- TOC entry 4822 (class 2606 OID 16666)
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- TOC entry 4824 (class 2606 OID 16676)
-- Name: usuarios usuarios_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key UNIQUE (email);


--
-- TOC entry 4826 (class 2606 OID 16674)
-- Name: usuarios usuarios_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id);


--
-- TOC entry 4843 (class 2606 OID 16723)
-- Name: biblioteca_libros biblioteca_libros_biblioteca_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.biblioteca_libros
    ADD CONSTRAINT biblioteca_libros_biblioteca_id_fkey FOREIGN KEY (biblioteca_id) REFERENCES public.bibliotecas(id);


--
-- TOC entry 4844 (class 2606 OID 16728)
-- Name: biblioteca_libros biblioteca_libros_libro_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.biblioteca_libros
    ADD CONSTRAINT biblioteca_libros_libro_id_fkey FOREIGN KEY (libro_id) REFERENCES public.libros(id);


--
-- TOC entry 4842 (class 2606 OID 16698)
-- Name: bibliotecas bibliotecas_colegio_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bibliotecas
    ADD CONSTRAINT bibliotecas_colegio_id_fkey FOREIGN KEY (colegio_id) REFERENCES public.colegios(id);


--
-- TOC entry 4845 (class 2606 OID 16744)
-- Name: prestamos prestamos_biblioteca_libro_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prestamos
    ADD CONSTRAINT prestamos_biblioteca_libro_id_fkey FOREIGN KEY (biblioteca_libro_id) REFERENCES public.biblioteca_libros(id);


--
-- TOC entry 4846 (class 2606 OID 16739)
-- Name: prestamos prestamos_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prestamos
    ADD CONSTRAINT prestamos_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id);


--
-- TOC entry 4841 (class 2606 OID 16677)
-- Name: usuarios usuarios_rol_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_rol_id_fkey FOREIGN KEY (rol_id) REFERENCES public.roles(id);


-- Completed on 2025-08-29 23:23:22

--
-- PostgreSQL database dump complete
--

\unrestrict oLsWrUCzQjQgTkwgpmdhwojbjoifjgPeYdd5zPNl4VEBvncLVijghP3lt3RCLcf

