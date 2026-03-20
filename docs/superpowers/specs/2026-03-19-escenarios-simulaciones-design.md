# Escenarios y Simulaciones - Design Spec

## Resumen

Implementar un sistema de **Escenarios** (bloques individuales reutilizables) y **Simulaciones** (combinaciones de escenarios aplicadas a una licitacion) que permita a los usuarios plantear situaciones hipoteticas y visualizar su impacto financiero como lineas adicionales en el grafico de punto de equilibrio.

## Conceptos Clave

- **Escenario**: Unidad reutilizable que describe una situacion hipotetica (ej: "Retraso 2 meses en entregas"). Pertenece a la organizacion. Tiene nombre, descripcion libre y parametros estructurados opcionales.
- **Simulacion**: Combinacion de uno o mas escenarios aplicada a una licitacion especifica. Cada simulacion genera una linea en el grafico de punto de equilibrio. Tiene nombre, color asignado y estado activo/inactivo (toggle de visibilidad).
- **Analisis de Simulacion**: Resultado de la inferencia de IA sobre una simulacion. Genera datos de curva (costo_fijo, ingreso_mensual, costo_variable_mensual) para graficar.

## Decisiones de Diseno

- **Enfoque A (analisis independiente)**: Cada simulacion genera su propia llamada a OpenAI, separada del analisis EVA base. Mas robusto, granular para control de tokens, y permite implementar incrementalmente.
- **Escenarios a nivel org**: Cualquier usuario de la org puede crear/editar/eliminar escenarios. No hay distincion de permisos dentro de la org.
- **Roles**: `client` = clientes (todos iguales dentro de su org), `evalitics` = administradores de la plataforma.
- **Control de tokens**: La IA solo se invoca al analizar, nunca en CRUD. Cada llamada de simulacion se registra con `usage_type = "scenario_analysis"`.
- **Secuencial por ahora**: EVA + simulaciones se procesan secuencialmente. Evolucion futura: Redis/Celery para procesamiento async.

---

## 1. Modelo de Datos

### Tabla `escenarios`

| Campo           | Tipo             | Notas                                                  |
|-----------------|------------------|--------------------------------------------------------|
| id              | INT PK           | Auto-increment                                         |
| organization_id | INT FK → orgs    | Org duena                                              |
| nombre          | VARCHAR(255)     | Ej: "Retraso 2 meses en entregas"                      |
| descripcion     | TEXT             | Descripcion libre del escenario                        |
| tipo            | VARCHAR(100), nullable | Categoria opcional (ej: "demora", "costos", "ingresos") |
| parametros      | JSON, nullable   | Campos estructurados opcionales (ej: `{"meses_demora": 2}`) |
| is_active       | BOOLEAN          | Soft delete / desactivar                               |
| created_by      | INT FK → users   | Quien lo creo                                          |
| created_at      | DATETIME         |                                                        |
| updated_at      | DATETIME         |                                                        |

### Tabla `simulaciones`

| Campo           | Tipo             | Notas                                                  |
|-----------------|------------------|--------------------------------------------------------|
| id              | INT PK           | Auto-increment                                         |
| licitacion_id   | INT FK → lics    | A que licitacion se aplica                             |
| organization_id | INT FK → orgs    |                                                        |
| nombre          | VARCHAR(255)     | Ej: "Retraso + inyeccion capital"                      |
| color           | VARCHAR(7), nullable | Color hex para la linea del grafico (ej: "#FF5733") |
| is_active       | BOOLEAN          | Toggle para mostrar/ocultar en grafico                 |
| created_by      | INT FK → users   |                                                        |
| created_at      | DATETIME         |                                                        |
| updated_at      | DATETIME         |                                                        |

### Tabla `simulacion_escenarios` (M-to-M)

| Campo          | Tipo            | Notas          |
|----------------|-----------------|----------------|
| id             | INT PK          |                |
| simulacion_id  | INT FK          | CASCADE delete |
| escenario_id   | INT FK          | ON DELETE RESTRICT — no se puede eliminar un escenario que este en uso en simulaciones. El usuario debe removerlo de las simulaciones primero. |

**Constraint**: UNIQUE(simulacion_id, escenario_id) — un escenario no puede estar duplicado en la misma simulacion.

**Limite**: Maximo 10 escenarios por simulacion para controlar largo del prompt y consumo de tokens.

### Tabla `analisis_simulacion`

| Campo           | Tipo             | Notas                                                  |
|-----------------|------------------|--------------------------------------------------------|
| id              | INT PK           |                                                        |
| simulacion_id   | INT FK           | ON DELETE CASCADE                                      |
| organization_id | INT, NOT NULL, INDEX | Denormalizado para queries rapidas (sin FK, consistente con AnalisisLicitacion existente) |
| analisis        | TEXT             | Texto del analisis generado por IA                     |
| model           | VARCHAR(100)     | Modelo usado (ej: gpt-4o-mini)                         |
| tokens_usados   | INT              |                                                        |
| curva_data      | JSON             | `{costo_fijo, ingreso_mensual, costo_variable_mensual, descripcion}` — `meses_total` se hereda del analisis EVA base |
| created_at      | DATETIME         |                                                        |

### Relaciones

- `Escenario` → pertenece a `Organization` (FK)
- `Simulacion` → pertenece a `Licitacion` + `Organization` (FKs)
- `Simulacion` ↔ `Escenario` — many-to-many via `simulacion_escenarios`
- `AnalisisSimulacion` → pertenece a `Simulacion` (1-to-many, se puede re-analizar). **Para graficos y UI siempre se usa el analisis mas reciente** (ORDER BY created_at DESC LIMIT 1). Los anteriores quedan como historial.
- CASCADE: eliminar simulacion elimina sus `simulacion_escenarios` y `analisis_simulacion`
- CASCADE: eliminar licitacion elimina sus simulaciones (y cascada)
- RESTRICT: eliminar escenario falla si esta en uso en alguna simulacion

---

## 2. API Endpoints

### Escenarios (biblioteca de la org)

| Metodo | Ruta                         | Descripcion                              |
|--------|------------------------------|------------------------------------------|
| POST   | `/api/data/escenarios`       | Crear escenario                          |
| GET    | `/api/data/escenarios`       | Listar escenarios de la org              |
| GET    | `/api/data/escenarios/{id}`  | Obtener uno                              |
| PATCH  | `/api/data/escenarios/{id}`  | Editar nombre/descripcion/tipo/parametros |
| DELETE | `/api/data/escenarios/{id}`  | Hard delete. Falla 409 si esta en uso en simulaciones. |

### Simulaciones (por licitacion)

| Metodo | Ruta                                                      | Descripcion                                      |
|--------|-----------------------------------------------------------|--------------------------------------------------|
| POST   | `/api/data/licitacion/{lic_id}/simulaciones`              | Crear simulacion (nombre, color, escenario_ids)  |
| GET    | `/api/data/licitacion/{lic_id}/simulaciones`              | Listar simulaciones con sus escenarios           |
| PATCH  | `/api/data/licitacion/{lic_id}/simulaciones/{sim_id}`     | Editar (nombre, color, escenarios, is_active)    |
| DELETE | `/api/data/licitacion/{lic_id}/simulaciones/{sim_id}`     | Eliminar simulacion + sus analisis               |
| PATCH  | `/api/data/licitacion/{lic_id}/simulaciones/{sim_id}/toggle` | Toggle is_active (convenience shortcut, equivale a PATCH con solo is_active) |

### Analisis de simulaciones

| Metodo | Ruta                                                              | Descripcion                               |
|--------|-------------------------------------------------------------------|-------------------------------------------|
| POST   | `/api/data/licitacion/{lic_id}/simulaciones/{sim_id}/analizar`    | Analizar UNA simulacion. Requiere EVA previo: retorna 422 si no existe. |
| GET    | `/api/data/licitacion/{lic_id}/simulaciones/{sim_id}/analisis`    | Historial de analisis de esa simulacion    |

### Integracion con EVA existente

El endpoint `POST /api/data/licitacion/{lic_id}/analizar` se extiende:
1. Ejecuta analisis EVA normalmente → genera `AnalisisLicitacion`
2. Busca simulaciones activas (`is_active=True`) de la licitacion
3. Secuencialmente analiza cada simulacion usando el EVA recien generado como contexto
4. Response incluye analisis EVA + lista de analisis de simulaciones

### Montaje de routers

- `escenarios.py` se monta como router independiente en `main.py` con `prefix="/api/data/escenarios"`
- `simulaciones.py` se monta como router independiente en `main.py` con `prefix="/api/data/licitacion"` y cada endpoint define `/{lic_id}/simulaciones/...` en su decorador

### Errores

| Codigo | Situacion |
|--------|-----------|
| 409    | Eliminar escenario que esta en uso en simulaciones |
| 422    | Analizar simulacion sin analisis EVA previo en la licitacion |
| 404    | Escenario/simulacion/licitacion no encontrado |
| 403    | Recurso no pertenece a la org del usuario |

### Schemas Pydantic

**Escenarios:**
```python
class EscenarioCreate(BaseModel):
    nombre: str                          # requerido
    descripcion: str                     # requerido
    tipo: Optional[str] = None
    parametros: Optional[dict] = None

class EscenarioUpdate(BaseModel):
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    tipo: Optional[str] = None
    parametros: Optional[dict] = None

class EscenarioOut(BaseModel):
    id: int
    nombre: str
    descripcion: str
    tipo: Optional[str]
    parametros: Optional[dict]
    is_active: bool
    created_by: int
    created_at: datetime
    updated_at: datetime
    simulaciones_count: int              # count de simulaciones que lo usan
```

**Simulaciones:**
```python
class SimulacionCreate(BaseModel):
    nombre: str                          # requerido
    color: Optional[str] = None          # hex, se auto-asigna si no se envia
    escenario_ids: list[int]             # al menos 1

class SimulacionUpdate(BaseModel):
    nombre: Optional[str] = None
    color: Optional[str] = None
    escenario_ids: Optional[list[int]] = None
    is_active: Optional[bool] = None

class SimulacionOut(BaseModel):
    id: int
    nombre: str
    color: str
    is_active: bool
    escenarios: list[EscenarioOut]       # escenarios que componen la simulacion
    ultimo_analisis: Optional[AnalisisSimulacionOut]  # el mas reciente, o null
    created_at: datetime

class AnalisisSimulacionOut(BaseModel):
    id: int
    analisis: str
    model: str
    tokens_usados: int
    curva_data: dict
    created_at: datetime
```

### Admin (evalitics)

| Metodo | Ruta                              | Descripcion                         |
|--------|-----------------------------------|-------------------------------------|
| GET    | `/api/admin/escenarios`           | Listar escenarios de todas las orgs |
| GET    | `/api/admin/simulaciones`         | Listar simulaciones de todas las orgs |
| DELETE | `/api/admin/escenarios/{id}`      | Eliminar escenario como superadmin  |
| DELETE | `/api/admin/simulaciones/{id}`    | Eliminar simulacion como superadmin |

---

## 3. Flujo de IA y Prompt

### Dos caminos segun contexto

**Camino 1: EVA incluye simulaciones (primer analisis o re-analisis)**

```
Usuario presiona "Analizar con EVA"
  |
  +- 1. Analisis EVA (documentos + prompt existente, sin cambios)
  |     -> guarda AnalisisLicitacion
  |
  +- 2. Hay simulaciones activas?
  |     |
  |     +- Si -> Para cada simulacion (secuencial):
  |     |        -> prompt con contexto EVA recien generado
  |     |        -> guarda AnalisisSimulacion
  |     |        -> registra token_usage (scenario_analysis)
  |     |
  |     +- No -> Fin
  |
  +- 3. Response: analisis EVA + lista de analisis de simulaciones
```

**Camino 2: Analisis individual de simulacion**

Solo disponible si ya existe un analisis EVA previo. Usa el mas reciente como contexto. Para analizar una simulacion nueva o re-analizar una existente sin correr EVA de nuevo.

### Prompt de simulacion

Mismo para ambos caminos:

```
CONTEXTO DE LA LICITACION:
- Analisis base: {analisis_base.analisis}
- Breakeven base: costo_fijo={X}, ingreso_mensual={Y}, costo_variable={Z}
- Curvas base: {curvas_data}

ESCENARIOS COMBINADOS EN ESTA SIMULACION:
1. "{escenario_1.nombre}": {escenario_1.descripcion}
   Parametros: {escenario_1.parametros}
2. "{escenario_2.nombre}": {escenario_2.descripcion}
   Parametros: {escenario_2.parametros}

INSTRUCCIONES:
Analiza el impacto financiero combinado de estos escenarios
sobre la licitacion. Considera como modifican costos fijos,
ingresos y costos variables respecto al escenario base.

Responde con:
1. Analisis textual breve (max 500 palabras) del impacto
2. Bloque JSON:
{
  "curva": {
    "costo_fijo": <CLP>,
    "ingreso_mensual": <CLP>,
    "costo_variable_mensual": <CLP>,
    "descripcion": "<descripcion breve>"
  }
}
```

### Notas clave del prompt

- Reutiliza el analisis EVA existente como contexto — no re-procesa documentos. Ahorra tokens.
- La estructura de `curva` sigue el mismo patron que cada escenario dentro de `curvas_data` (optimista/base/pesimista), con los mismos campos: `costo_fijo`, `ingreso_mensual`, `costo_variable_mensual`, `descripcion`.
- `meses_total` NO se incluye en la respuesta de simulacion — el frontend hereda el `meses_total` del analisis EVA base para el eje X del grafico.
- Output acotado: solo impacto + datos de curva (no un analisis EVA completo).

### Transaccionalidad

Cada analisis de simulacion se commitea independientemente. Si EVA tiene exito pero una simulacion falla (ej: rate limit de OpenAI), el analisis EVA y las simulaciones ya procesadas se preservan. Las fallidas se reportan en el response con su error para que el usuario pueda re-intentar individualmente.

### Token Usage

- EVA base → `usage_type = "analysis"` (sin cambios)
- Cada simulacion → `usage_type = "scenario_analysis"` (nuevo)
- Se extiende el enum `UsageType` existente en el modelo `TokenUsage`

### Evolucion futura

Hoy todo secuencial. A futuro: cola con Redis/Celery para que EVA se muestre inmediatamente y simulaciones se procesen async (polling o websockets).

---

## 4. Frontend

### 4.1 Pagina dedicada "Escenarios" (nuevo item en navbar)

Accesible desde la navegacion principal al mismo nivel que Licitaciones y Archivos.

**Dos tabs:**

**Tab "Biblioteca de Escenarios":**
- Tabla con columnas: Nombre, Descripcion, Tipo (badge), Usado en (count de simulaciones), Acciones (Editar, Eliminar)
- Busqueda por nombre y filtro por tipo
- Boton "+ Nuevo Escenario" abre modal/formulario con: nombre, descripcion (textarea), tipo (select opcional), parametros (key-value dinamico, opcional)

**Tab "Simulaciones":**
- Tabla agrupada por licitacion mostrando: Licitacion, Nombre simulacion, Escenarios (badges), Estado (analizado/sin analizar), Visible (toggle), Acciones
- Filtro por licitacion

### 4.2 Vista minimalista en LicitacionDetailPage

Nueva seccion debajo del analisis EVA. Diseno compacto:
- Filas con: checkbox visibilidad (con color de la simulacion), dot de color, nombre, badges de escenarios, estado, boton analizar/re-analizar
- Boton "+ Agregar simulacion" abre modal donde se selecciona nombre, color, y escenarios de la biblioteca (multiselect)
- Simulaciones sin analizar tienen checkbox deshabilitado y boton "Analizar" azul
- Simulaciones analizadas tienen boton "Re-analizar" sutil
- Link al pie: "Administrar escenarios y simulaciones →" que navega a la pagina dedicada

### 4.3 Grafico de Punto de Equilibrio (BreakevenChart extendido)

- Las 3 lineas base (optimista/base/pesimista) se mantienen como lineas solidas
- Cada simulacion activa y analizada agrega una linea **punteada** con el color asignado a la simulacion
- La curva se calcula igual: `profit(t) = (ingreso_mensual - costo_variable_mensual) * t - costo_fijo`
- `meses_total` se hereda del analisis EVA base — todas las lineas comparten el mismo eje X
- Leyenda extendida: muestra las 3 base + cada simulacion con su nombre y color
- Tooltip incluye valores de todas las lineas visibles
- Auto-asignacion de colores: paleta predefinida (ej: `["#f97316","#06b6d4","#a855f7","#ec4899","#14b8a6","#eab308"]`) asigna el siguiente color disponible al crear simulacion. El usuario puede cambiarlo.

**Props extendidas de BreakevenChart:**
```typescript
interface SimulacionLine {
  nombre: string;
  color: string;
  curva_data: {
    costo_fijo: number;
    ingreso_mensual: number;
    costo_variable_mensual: number;
    descripcion: string;
  };
}

interface BreakevenChartProps {
  curvas: CurvasData;                   // existente (base)
  simulaciones?: SimulacionLine[];      // nuevo (lineas punteadas)
}
```

### 4.4 Modal "Crear/Editar Simulacion"

- Campo nombre (texto)
- Selector de color (paleta predefinida o color picker)
- Multiselect de escenarios disponibles en la org (con busqueda)
- Preview de escenarios seleccionados como badges removibles
- Boton guardar

### 4.5 Admin (evalitics)

Se extiende AdminPage con nueva tab/seccion:

**Token Usage (extendido):**
- Nueva columna/fila `scenario_analysis` junto a `analysis` y `chat` en el resumen por org

**Tab "Escenarios & Simulaciones":**
- Lista de escenarios de todas las orgs: org, nombre, tipo, cantidad de simulaciones, fecha
- Lista de simulaciones de todas las orgs: org, licitacion, nombre, escenarios, estado, tokens consumidos
- Acciones: eliminar como superadmin
- Filtros por organizacion

---

## 5. Archivos a Crear/Modificar

### Backend - Nuevos

- `app/models/escenario.py` — Modelo Escenario
- `app/models/simulacion.py` — Modelos Simulacion, SimulacionEscenario, AnalisisSimulacion
- `app/schemas/escenario.py` — Schemas Pydantic para escenarios
- `app/schemas/simulacion.py` — Schemas Pydantic para simulaciones
- `app/services/escenario_service.py` — CRUD escenarios
- `app/services/simulacion_service.py` — CRUD simulaciones + logica de analisis
- `app/routers/escenarios.py` — Router de escenarios
- `app/routers/simulaciones.py` — Router de simulaciones
- `migrations/003_create_escenarios.sql` — DDL tabla escenarios
- `migrations/004_create_simulaciones.sql` — DDL tablas simulaciones, simulacion_escenarios, analisis_simulacion
- `migrations/005_alter_token_usage_enum.sql` — ALTER TABLE token_usage para agregar 'scenario_analysis' al ENUM

### Backend - Modificar

- `app/models/__init__.py` — Registrar nuevos modelos
- `app/main.py` — Registrar nuevos routers
- `app/services/analysis_service.py` — Extender `analyze_licitacion()` para procesar simulaciones activas post-EVA
- `app/routers/admin.py` — Agregar endpoints de admin para escenarios/simulaciones + reestructurar logica de token usage summary para soportar `scenario_analysis` (el bucket actual hardcodea solo analysis/chat)
- `app/models/token_usage.py` — Agregar `scenario_analysis` al enum `UsageType`

### Frontend - Nuevos

- `src/pages/EscenariosPage.tsx` — Pagina dedicada con tabs
- `src/services/escenarios.ts` — API client para escenarios
- `src/services/simulaciones.ts` — API client para simulaciones
- `src/components/SimulacionesPanel.tsx` — Vista compacta para LicitacionDetailPage
- `src/components/CrearSimulacionModal.tsx` — Modal crear/editar simulacion

### Frontend - Modificar

- `src/App.tsx` — Agregar ruta `/escenarios`
- `src/components/Navigation.tsx` — Agregar link "Escenarios" al navbar
- `src/components/BreakevenChart.tsx` — Extender para aceptar lineas de simulaciones (punteadas, con colores custom)
- `src/pages/LicitacionDetailPage.tsx` — Integrar SimulacionesPanel
- `src/pages/AdminPage.tsx` — Agregar tab/seccion de escenarios y simulaciones
- `src/services/admin.ts` — Agregar llamadas para escenarios/simulaciones admin
