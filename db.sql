--
-- PostgreSQL database dump
--

\restrict CBApZPlxtMC4EMnEHYayhJgtWsnYhHi4YrgZT76mniY1kDOqOjEmM9OjSI8hgIT

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

-- Started on 2025-09-29 21:05:04

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

DROP DATABASE IF EXISTS xonler;
--
-- TOC entry 5042 (class 1262 OID 16388)
-- Name: xonler; Type: DATABASE; Schema: -; Owner: postgres
--

CREATE DATABASE xonler WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'Spanish_Colombia.1252';


ALTER DATABASE xonler OWNER TO postgres;

\unrestrict CBApZPlxtMC4EMnEHYayhJgtWsnYhHi4YrgZT76mniY1kDOqOjEmM9OjSI8hgIT
\connect xonler
\restrict CBApZPlxtMC4EMnEHYayhJgtWsnYhHi4YrgZT76mniY1kDOqOjEmM9OjSI8hgIT

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
-- TOC entry 5043 (class 0 OID 0)
-- Dependencies: 6
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: pg_database_owner
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- TOC entry 275 (class 1255 OID 16821)
-- Name: _ensure_role_is_admin_cliente(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public._ensure_role_is_admin_cliente() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE v_rol bigint;
BEGIN
  SELECT rol_id INTO v_rol FROM public.usuarios WHERE id = NEW.usuario_id;
  IF v_rol IS DISTINCT FROM 2 THEN
    RAISE EXCEPTION 'admin_bibliotecas solo admite usuarios con rol_id = 2 (recibido=%)', v_rol
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public._ensure_role_is_admin_cliente() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 233 (class 1259 OID 16802)
-- Name: admin_bibliotecas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.admin_bibliotecas (
    usuario_id bigint NOT NULL,
    biblioteca_id bigint NOT NULL,
    can_manage boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.admin_bibliotecas OWNER TO postgres;

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
-- TOC entry 234 (class 1259 OID 16823)
-- Name: usuario_biblioteca; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.usuario_biblioteca (
    usuario_id bigint NOT NULL,
    biblioteca_id bigint NOT NULL
);


ALTER TABLE public.usuario_biblioteca OWNER TO postgres;

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
    preferencias jsonb DEFAULT '{}'::jsonb NOT NULL,
    dobleautenticacion boolean DEFAULT false NOT NULL
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
-- TOC entry 5035 (class 0 OID 16802)
-- Dependencies: 233
-- Data for Name: admin_bibliotecas; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.admin_bibliotecas (usuario_id, biblioteca_id, can_manage, created_at) FROM stdin;
\.


--
-- TOC entry 5032 (class 0 OID 16716)
-- Dependencies: 230
-- Data for Name: biblioteca_libros; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.biblioteca_libros (id, biblioteca_id, libro_id) FROM stdin;
1	1	1
2	1	2
3	1	3
4	1	4
5	1	5
6	1	6
7	2	7
8	2	8
9	2	9
10	2	10
11	2	11
12	2	12
13	3	13
14	3	14
15	3	15
16	3	16
17	3	17
18	3	18
19	4	19
20	4	20
21	4	21
22	4	22
23	4	23
24	4	24
25	5	25
26	5	26
27	5	27
28	5	28
29	5	29
30	5	30
34	3	31
35	2	32
\.


--
-- TOC entry 5028 (class 0 OID 16691)
-- Dependencies: 226
-- Data for Name: bibliotecas; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.bibliotecas (id, nombre, direccion, colegio_id) FROM stdin;
1	Biblioteca Central UdeA	Calle 67 #53-108, Bloque B	1
2	Biblioteca Luis Echavarría Villegas (EAFIT)	Carrera 49 #7 Sur-50, Ed. 47A	2
3	Biblioteca PoliJaime	Carrera 65 #59A-110, Sótano 1	3
4	Biblioteca Pública Piloto	Calle 53 #48-23	4
5	Biblioteca El Salvador	Transversal 92 #37-25	5
8	Biblioteca San Cristóbal	carrera 141#62-86	4
\.


--
-- TOC entry 5026 (class 0 OID 16683)
-- Dependencies: 224
-- Data for Name: colegios; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.colegios (id, nombre, direccion) FROM stdin;
1	Universidad de Antioquia	Calle 67 #53-108, Medellín
2	Universidad EAFIT	Carrera 49 #7 Sur-50, Medellín
3	Politécnico Colombiano Jaime Isaza Cadavid	Carrera 65 #59A-110, Medellín
4	Biblioteca Pública Piloto	Calle 53 #48-23, Medellín
5	Biblioteca Pública El Salvador	Transversal 92 #37-25, Medellín
6	hola	# 62-86 Carrera 141
\.


--
-- TOC entry 5030 (class 0 OID 16704)
-- Dependencies: 228
-- Data for Name: libros; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.libros (id, titulo, autor, isbn, imagen_url, descripcion, categoria, disponibilidad) FROM stdin;
7	Matar a un ruiseñor	Harper Lee	9780061120084	/assets/images/libro-placeholder.jpg	Atticus Finch defiende a un hombre negro injustamente acusado en el profundo sur americano, a través de los ojos de Scout.	Literatura	t
8	La Odisea	Homero	9780140268867	/assets/images/libro-placeholder.jpg	El héroe Odiseo navega mares llenos de monstruos y dioses para regresar a Ítaca después de la Guerra de Troya.	Historia	t
9	Ulises	James Joyce	9780141182803	/assets/images/libro-placeholder.jpg	El monólogo interior de Leopold Bloom revive las obsesiones y reflexiones de un día en la vida de un dublines.	Ficción	t
10	Moby Dick	Herman Melville	9780142437247	/assets/images/libro-placeholder.jpg	La odisea de Ahab en busca de la gran ballena blanca que le arrebató una pierna, explorando la locura y la obsesión.	Ficción	t
11	Ana Karenina	León Tolstói	9780140449174	/assets/images/libro-placeholder.jpg	Anna Karenina desafía las convenciones de la nobleza rusa al embarcarse en un amor prohibido que cambiará su destino.	Literatura	t
12	Frankenstein	Mary Shelley	9780141439471	/assets/images/libro-placeholder.jpg	Víctor Frankenstein crea vida artificial, desatando consecuencias trágicas y reflexiones sobre la ambición humana.	Ficción	t
13	Drácula	Bram Stoker	9780141439846	/assets/images/libro-placeholder.jpg	El conde Drácula, un vampiro de Transilvania, siembra el terror en Londres mientras busca nuevas víctimas.	Ficción	t
14	El retrato de Dorian Gray	Oscar Wilde	9780141439570	/assets/images/libro-placeholder.jpg	Dorian Gray permanece eternamente joven mientras su retrato envejece y refleja su corrupción moral.	Ficción	t
15	Fahrenheit 451	Ray Bradbury	9781451673319	/assets/images/libro-placeholder.jpg	En un futuro en que los libros están prohibidos, Montag, un bombero, comienza a cuestionar la quemazón de la cultura escrita.	Ciencia	t
16	La metamorfosis	Franz Kafka	9780143105244	/assets/images/libro-placeholder.jpg	Gregor Samsa se transforma en un insecto gigante, explorando el absurdo y el aislamiento en la sociedad moderna.	Ficción	t
17	El extranjero	Albert Camus	9788491050214	/assets/images/libro-placeholder.jpg	Meursault, indiferente ante la vida y la muerte, enfrenta un juicio tras cometer un asesinato sin aparente motivo.	Ficción	t
18	Rayuela	Julio Cortázar	9780307476464	/assets/images/libro-placeholder.jpg	Horacio Oliveira y La Maga deambulan por París y Buenos Aires en busca de sentido y amor en un mosaic.	Literatura	t
19	El amor en los tiempos del cólera	Gabriel García Márquez	9780307389732	/assets/images/libro-placeholder.jpg	Florentino Ariza espera décadas para poder declararse a Fermina Daza, narrando un amor que perdura contra todo.	Literatura	t
20	La colmena	Camilo José Cela	9788432214062	/assets/images/libro-placeholder.jpg	Un retrato coral de la posguerra española, mostrando vidas anónimas que revelan la complejidad del alma humana.	Historia	t
21	Pedro Páramo	Juan Rulfo	9786071603436	/assets/images/libro-placeholder.jpg	Juan Preciado llega a Comala para encontrar a su padre muerto, descubriendo un pueblo poblado por fantasmas.	Literatura	t
22	Cándido	Voltaire	9780140440049	/assets/images/libro-placeholder.jpg	Cándido recorre el mundo sufriendo calamidades que ponen en duda el optimismo de Leibniz.	Filosofía	t
23	El sonido y la furia	William Faulkner	9780679732242	/assets/images/libro-placeholder.jpg	La decadente familia Compson narra su tragedia en el sur de Estados Unidos, explorando la memoria y el tiempo.	Literatura	t
24	Los hermanos Karamázov	Fiódor Dostoievski	9780140449242	/assets/images/libro-placeholder.jpg	Los tres hermanos Karamázov debaten la fe, la moral y la libertad en la Rusia de finales del siglo XIX.	Ficción	t
26	La casa de los espíritus	Isabel Allende	9780061148529	/assets/images/libro-placeholder.jpg	La saga de la familia Trueba explora la historia de Chile del siglo XX entre fantasmas y política.	Literatura	t
27	Siddhartha	Hermann Hesse	9780141189572	/assets/images/libro-placeholder.jpg	Siddhartha busca la iluminación a través del viaje espiritual y el desapego en la India antigua.	Filosofía	t
31	El silencio de los corderos	Thomas Harris	978-8497930002	/assets/images/libro-placeholder.jpg	\tUna joven agente del FBI busca la ayuda de Hannibal Lecter, un brillante psiquiatra y asesino en serie, para atrapar a otro criminal.	Otros	t
30	El túnel	Ernesto Sabato	9780140446137	/assets/images/libro-placeholder.jpg	Juan Pablo Castel obsesionado con María, causa un asesinato a los pies de un túnel olvidado.	Ficción	f
28	Cumbres borrascosas	Emily Brontë	9780141439556	/assets/images/libro-placeholder.jpg	Una pareja de recién casados vive la monotonía de la alta sociedad en la Inglaterra decimonónica.	Literatura	f
29	Lolita	Vladimir Nabokov	9780679723165	/assets/images/libro-placeholder.jpg	Humbert Humbert narra su obsesiva pasión por la joven Lolita, explorando los límites de la moral.	Ficción	f
3	Don Quijote de la Mancha	Miguel de Cervantes	9788491050252	/assets/images/libro-placeholder.jpg	Las aventuras del ingenioso hidalgo Don Quijote y su fiel escudero Sancho Panza, en clave de sátira y epopeya.	Literatura	t
32	Dune	Frank Herbert	978-0441172719	/assets/images/libro-placeholder.jpg	Una epopeya interplanetaria sobre política, ecología y destino en el árido planeta Arrakis.	Otros	f
25	Crónica de una muerte anunciada	Gabriel García Márquez	9780060883287	/assets/images/libro-placeholder.jpg	Santiago Nasar está predestinado a morir por una afrenta familiar; García Márquez reconstruye los últimos días antes del crimen.	Literatura	f
1	1984	George Orwell	9780451524935	/assets/images/libro-placeholder.jpg	Una distopía clásica en la que Winston Smith desafía la vigilancia del Gran Hermano.	Ficción	t
4	El Principito	Antoine de Saint-Exupéry	9788408130701	/assets/images/libro-placeholder.jpg	Un niño príncipe comparte sus reflexiones sobre la vida, el amor y la amistad en su viaje interplanetario.	Ficción	t
5	Crimen y castigo	Fiódor Dostoievski	9780140449136	/assets/images/libro-placeholder.jpg	Winston Smith, en un régimen totalitario, intenta preservar su humanidad confrontando la vigilancia constante del Gran Hermano.	Ficción	t
6	Orgullo y prejuicio	Jane Austen	9780141040349	/assets/images/libro-placeholder.jpg	Elizabeth Bennet y Mr. Darcy luchan contra los prejuicios sociales y personales para encontrar el verdadero amor.	Literatura	t
2	Cien años de soledad	Gabriel García Márquez	9780307474728	/assets/images/libro-placeholder.jpg	La historia de la familia Buendía a lo largo de varias generaciones en el mítico pueblo de Macondo.	Literatura	f
\.


--
-- TOC entry 5034 (class 0 OID 16734)
-- Dependencies: 232
-- Data for Name: prestamos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.prestamos (id, usuario_id, biblioteca_libro_id, fecha_prestamo, fecha_devolucion) FROM stdin;
\.


--
-- TOC entry 5022 (class 0 OID 16660)
-- Dependencies: 220
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.roles (id, name) FROM stdin;
1	usuario
2	admin
3	adminAdvanced
\.


--
-- TOC entry 5036 (class 0 OID 16823)
-- Dependencies: 234
-- Data for Name: usuario_biblioteca; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.usuario_biblioteca (usuario_id, biblioteca_id) FROM stdin;
10	1
\.


--
-- TOC entry 5024 (class 0 OID 16668)
-- Dependencies: 222
-- Data for Name: usuarios; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.usuarios (id, nombre, email, password_hash, rol_id, created_at, updated_at, telefono, fecha_nacimiento, genero, direccion, ciudad, codigo_postal, apellido, preferencias, dobleautenticacion) FROM stdin;
10	miguel	luiseduardo13@gmail.com	$2b$12$sgPsHioI0cer/Jd931JCrugmn2ZCAzdIBvHRTJPrQAHnBR0SlOpfK	2	2025-09-05 20:53:18.001074	2025-09-05 20:53:53.644803	\N	\N	\N	\N	\N	\N	noreña	{"tema": "auto", "twofa": {"created_at": "2025-09-05T20:53:31.910513-05:00", "secret_base32": "EZFU6UZWNRMDCJCVORSVMO2OLNUDEUZS"}, "idioma": "es", "appPrestamos": true, "emailEventos": false, "tamanoFuente": "medium", "maxResultados": "20", "emailPrestamos": true, "appMantenimiento": false, "emailNuevosLibros": true, "appRecomendaciones": true, "categoriasFavoritas": ["ficcion", "ciencia"]}	f
12	miguel	mianel200413@gmail.com	$2b$12$hfFXWjpIsDKA78Up.bI9M.1IhiM/fucX/B.JQMknvpmj.BMxdRJpS	1	2025-09-25 20:00:43.292827	2025-09-25 20:00:43.292827	\N	\N	\N	\N	\N	\N	noreña	{}	f
\.


--
-- TOC entry 5044 (class 0 OID 0)
-- Dependencies: 229
-- Name: biblioteca_libros_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.biblioteca_libros_id_seq', 35, true);


--
-- TOC entry 5045 (class 0 OID 0)
-- Dependencies: 225
-- Name: bibliotecas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.bibliotecas_id_seq', 8, true);


--
-- TOC entry 5046 (class 0 OID 0)
-- Dependencies: 223
-- Name: colegios_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.colegios_id_seq', 6, true);


--
-- TOC entry 5047 (class 0 OID 0)
-- Dependencies: 227
-- Name: libros_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.libros_id_seq', 32, true);


--
-- TOC entry 5048 (class 0 OID 0)
-- Dependencies: 231
-- Name: prestamos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.prestamos_id_seq', 11, true);


--
-- TOC entry 5049 (class 0 OID 0)
-- Dependencies: 219
-- Name: roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.roles_id_seq', 3, true);


--
-- TOC entry 5050 (class 0 OID 0)
-- Dependencies: 221
-- Name: usuarios_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.usuarios_id_seq', 12, true);


--
-- TOC entry 4858 (class 2606 OID 16808)
-- Name: admin_bibliotecas admin_bibliotecas_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_bibliotecas
    ADD CONSTRAINT admin_bibliotecas_pkey PRIMARY KEY (usuario_id, biblioteca_id);


--
-- TOC entry 4850 (class 2606 OID 16722)
-- Name: biblioteca_libros biblioteca_libros_biblioteca_id_libro_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.biblioteca_libros
    ADD CONSTRAINT biblioteca_libros_biblioteca_id_libro_id_key UNIQUE (biblioteca_id, libro_id);


--
-- TOC entry 4852 (class 2606 OID 16720)
-- Name: biblioteca_libros biblioteca_libros_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.biblioteca_libros
    ADD CONSTRAINT biblioteca_libros_pkey PRIMARY KEY (id);


--
-- TOC entry 4843 (class 2606 OID 16697)
-- Name: bibliotecas bibliotecas_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bibliotecas
    ADD CONSTRAINT bibliotecas_pkey PRIMARY KEY (id);


--
-- TOC entry 4841 (class 2606 OID 16689)
-- Name: colegios colegios_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.colegios
    ADD CONSTRAINT colegios_pkey PRIMARY KEY (id);


--
-- TOC entry 4846 (class 2606 OID 16714)
-- Name: libros libros_isbn_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.libros
    ADD CONSTRAINT libros_isbn_key UNIQUE (isbn);


--
-- TOC entry 4848 (class 2606 OID 16712)
-- Name: libros libros_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.libros
    ADD CONSTRAINT libros_pkey PRIMARY KEY (id);


--
-- TOC entry 4856 (class 2606 OID 16738)
-- Name: prestamos prestamos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prestamos
    ADD CONSTRAINT prestamos_pkey PRIMARY KEY (id);


--
-- TOC entry 4834 (class 2606 OID 16666)
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- TOC entry 4864 (class 2606 OID 16827)
-- Name: usuario_biblioteca usuario_biblioteca_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuario_biblioteca
    ADD CONSTRAINT usuario_biblioteca_pkey PRIMARY KEY (usuario_id);


--
-- TOC entry 4837 (class 2606 OID 16676)
-- Name: usuarios usuarios_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key UNIQUE (email);


--
-- TOC entry 4839 (class 2606 OID 16674)
-- Name: usuarios usuarios_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id);


--
-- TOC entry 4859 (class 1259 OID 16820)
-- Name: idx_admin_bibliotecas_biblioteca; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_admin_bibliotecas_biblioteca ON public.admin_bibliotecas USING btree (biblioteca_id);


--
-- TOC entry 4860 (class 1259 OID 16819)
-- Name: idx_admin_bibliotecas_usuario; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_admin_bibliotecas_usuario ON public.admin_bibliotecas USING btree (usuario_id);


--
-- TOC entry 4844 (class 1259 OID 16799)
-- Name: idx_bibliotecas_colegio; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bibliotecas_colegio ON public.bibliotecas USING btree (colegio_id);


--
-- TOC entry 4853 (class 1259 OID 16798)
-- Name: idx_bllibros_biblioteca; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bllibros_biblioteca ON public.biblioteca_libros USING btree (biblioteca_id);


--
-- TOC entry 4854 (class 1259 OID 16797)
-- Name: idx_prestamos_bllibro_fecha; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_prestamos_bllibro_fecha ON public.prestamos USING btree (biblioteca_libro_id, fecha_prestamo);


--
-- TOC entry 4861 (class 1259 OID 16839)
-- Name: ix_usuario_biblioteca__biblio; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_usuario_biblioteca__biblio ON public.usuario_biblioteca USING btree (biblioteca_id);


--
-- TOC entry 4862 (class 1259 OID 16838)
-- Name: ix_usuario_biblioteca__usuario; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_usuario_biblioteca__usuario ON public.usuario_biblioteca USING btree (usuario_id);


--
-- TOC entry 4835 (class 1259 OID 16801)
-- Name: ix_usuarios_prefs_gin; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_usuarios_prefs_gin ON public.usuarios USING gin (preferencias);


--
-- TOC entry 4875 (class 2620 OID 16822)
-- Name: admin_bibliotecas trg_admin_bibliotecas_only_role2; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_admin_bibliotecas_only_role2 BEFORE INSERT OR UPDATE ON public.admin_bibliotecas FOR EACH ROW EXECUTE FUNCTION public._ensure_role_is_admin_cliente();


--
-- TOC entry 4871 (class 2606 OID 16814)
-- Name: admin_bibliotecas admin_bibliotecas_biblioteca_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_bibliotecas
    ADD CONSTRAINT admin_bibliotecas_biblioteca_id_fkey FOREIGN KEY (biblioteca_id) REFERENCES public.bibliotecas(id) ON DELETE CASCADE;


--
-- TOC entry 4872 (class 2606 OID 16809)
-- Name: admin_bibliotecas admin_bibliotecas_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_bibliotecas
    ADD CONSTRAINT admin_bibliotecas_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE CASCADE;


--
-- TOC entry 4867 (class 2606 OID 16723)
-- Name: biblioteca_libros biblioteca_libros_biblioteca_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.biblioteca_libros
    ADD CONSTRAINT biblioteca_libros_biblioteca_id_fkey FOREIGN KEY (biblioteca_id) REFERENCES public.bibliotecas(id);


--
-- TOC entry 4868 (class 2606 OID 16728)
-- Name: biblioteca_libros biblioteca_libros_libro_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.biblioteca_libros
    ADD CONSTRAINT biblioteca_libros_libro_id_fkey FOREIGN KEY (libro_id) REFERENCES public.libros(id);


--
-- TOC entry 4866 (class 2606 OID 16698)
-- Name: bibliotecas bibliotecas_colegio_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bibliotecas
    ADD CONSTRAINT bibliotecas_colegio_id_fkey FOREIGN KEY (colegio_id) REFERENCES public.colegios(id);


--
-- TOC entry 4869 (class 2606 OID 16744)
-- Name: prestamos prestamos_biblioteca_libro_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prestamos
    ADD CONSTRAINT prestamos_biblioteca_libro_id_fkey FOREIGN KEY (biblioteca_libro_id) REFERENCES public.biblioteca_libros(id);


--
-- TOC entry 4870 (class 2606 OID 16739)
-- Name: prestamos prestamos_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prestamos
    ADD CONSTRAINT prestamos_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id);


--
-- TOC entry 4873 (class 2606 OID 16833)
-- Name: usuario_biblioteca usuario_biblioteca_biblioteca_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuario_biblioteca
    ADD CONSTRAINT usuario_biblioteca_biblioteca_id_fkey FOREIGN KEY (biblioteca_id) REFERENCES public.bibliotecas(id) ON DELETE CASCADE;


--
-- TOC entry 4874 (class 2606 OID 16828)
-- Name: usuario_biblioteca usuario_biblioteca_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuario_biblioteca
    ADD CONSTRAINT usuario_biblioteca_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE CASCADE;


--
-- TOC entry 4865 (class 2606 OID 16677)
-- Name: usuarios usuarios_rol_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_rol_id_fkey FOREIGN KEY (rol_id) REFERENCES public.roles(id);


-- Tabla para tokens de recuperación de contraseña
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);

-- Completed on 2025-09-29 21:05:05

--
-- PostgreSQL database dump complete
--

\unrestrict CBApZPlxtMC4EMnEHYayhJgtWsnYhHi4YrgZT76mniY1kDOqOjEmM9OjSI8hgIT

