# ⚡ Energy Anomaly Detector

**Dashboard de detección de anomalías en consumo energético utilizando machine learning**

[![Java](https://img.shields.io/badge/Java-21-blue.svg)](https://adoptium.net/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.2-green.svg)](https://spring.io/projects/spring-boot)
[![Angular](https://img.shields.io/badge/Angular-17-red.svg)](https://angular.io/)

---

## 📖 Descripción

Plataforma de monitoreo que detecta patrones anómalos en el consumo energético de instalaciones industriales. Inspirado en escenarios reales del sector eléctrico — como los gestionados para Iberdrola — el sistema procesa series temporales de consumo y señala desviaciones significativas mediante algoritmos de machine learning.

**Problema que resuelve:** Las distribuidoras de energía necesitan identificar consumos irregulares (fugas, errores de medición, fraude) antes de que impacten en la red. Este dashboard automatiza esa tarea, permitiendo que un operador identifique anomalías en minutos en lugar de horas de análisis manual.

---

## 🧰 Tech Stack

| Capa | Tecnología |
|---|---|
| **Frontend** | Angular 17 · TypeScript · ECharts |
| **Backend** | Spring Boot 3.2 · Java 21 |
| **ML Engine** | Z-score · IQR · Isolation Forest (Python embebido) |
| **API** | REST · Swagger/OpenAPI |
| **Datos** | JSON series temporales · CSV import |

---

## ✨ Features

- **Detección multi-algoritmo:** Tres métodos de detección (Z-score, IQR, Isolation Forest) aplicados en paralelo para mayor cobertura.
- **Dashboard visual:** Gráfico de línea temporal con marcadores de anomalía codificados por color y severidad.
- **Tabla de alertas:** Lista filtrable con timestamp, ubicación, valor observado, umbral y score de anomalía.
- **Importación CSV:** Carga masiva de series temporales de consumo desde archivos CSV estructurados.
- **Swagger API docs:** Documentación completa de la API REST con ejemplos interactivos.

---

## 🎨 Demo

El dashboard presenta:

1. **Gráfico de consumo** — Serie temporal con línea de consumo diario y bandas de confianza.
2. **Marcadores de anomalía** — Puntos rojos/naranjas sobre el gráfico indicando desviaciones detectadas por cada algoritmo.
3. **Tabla de alertas** — Filas con nivel de severidad (🔴 Alto / 🟡 Medio / 🟢 Bajo), ubicación del punto de medida y delta respecto al umbral.
4. **Panel de configuración** — Selector de algoritmo, umbral de sensibilidad y rango de fechas.

---

## 🏗️ Arquitectura

```
┌──────────────────────────────────────────────────────────┐
│                    Frontend (Angular 17)                  │
│         ECharts · Gráfico interactivo + tabla            │
└────────────────────────┬────────────────────────────────┘
                         │ HTTP/REST
┌────────────────────────▼────────────────────────────────┐
│                   API Layer (Spring Boot)                 │
│              Controllers · Swagger · DTOs               │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│                Business Logic Layer                      │
│     AnomalyDetectionService · Z-score · IQR · IF         │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│                      Data Layer                          │
│        ConsumptionSeriesRepository · JSON/CSV             │
└──────────────────────────────────────────────────────────┘
```

---

## 🚀 Setup

### Requisitos

- **Java 21** (o Java 17 como mínimo)
- **Node.js 18+** y **npm**
- **Angular CLI 17**

### Backend

```bash
cd energy-anomaly-detector/backend
./mvnw spring-boot:run
# API disponible en http://localhost:8080
# Swagger UI: http://localhost:8080/swagger-ui.html
```

### Frontend

```bash
cd energy-anomaly-detector/frontend
npm install
ng serve
# App disponible en http://localhost:4200
```

### Cargar datos de ejemplo

```bash
# Endpoint para importar CSV
curl -X POST http://localhost:8080/api/consumption/import \
  -H "Content-Type: multipart/form-data" \
  -F "file=@src/main/resources/sample_data.csv"
```

---

## 📂 Estructura del proyecto

```
energy-anomaly-detector/
├── backend/
│   ├── src/main/java/.../
│   │   ├── controller/     # REST controllers
│   │   ├── service/       # Lógica de detección
│   │   ├── model/         # Entidades y DTOs
│   │   └── repository/    # Acceso a datos
│   └── src/main/resources/
│       └── sample_data.csv # Dataset de ejemplo
└── frontend/
    ├── src/app/
    │   ├── dashboard/     # Componente principal
    │   ├── chart/         # Visualización ECharts
    │   └── alerts-table/   # Tabla de alertas
    └── src/assets/
```

---

## 📬 Contacto

- ✉️ **Email:** [georgepopadev@gmail.com](mailto:georgepopadev@gmail.com)
- 💻 **GitHub:** [github.com/georgepopadev/energy-anomaly-detector](https://github.com/georgepopadev/energy-anomaly-detector)
