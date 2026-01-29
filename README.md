# Ferretería Bruzzone - ERP Inteligente v4.0

Sistema integral de gestión de alto rendimiento diseñado para ferreterías industriales y minoristas. Potenciado por Inteligencia Artificial (Google Gemini) y sincronización en tiempo real vía Firebase.

## 🚀 Características Principales

- **IA Vision Service**: Escaneo inteligente de facturas de proveedores para carga automática de stock y costos.
- **Sincronización Cloud**: Base de datos Firestore para actualización instantánea entre múltiples terminales y sucursales.
- **Módulo Fiscal (ARCA/AFIP)**: Gestión de facturación electrónica y libro de sueldos digital.
- **Terminal de Ventas (POS)**: Interfaz de alta velocidad con soporte para ventas fraccionadas y múltiples listas de precios.
- **Omnicanalidad**: E-commerce integrado y portal exclusivo para clientes.
- **Logística & Depósito**: Control de stock crítico, transferencias entre sucursales y gestión de remitos.

## 🛠️ Stack Tecnológico

- **Frontend**: React 19 + TypeScript.
- **Diseño**: Tailwind CSS con sistema de diseño modular.
- **Backend-as-a-Service**: Firebase (Firestore, Auth).
- **IA**: Google Gemini 2.0 Flash (vía @google/genai).
- **Herramientas**: Vite, Lucide React, Recharts, XLSX.

## 📦 Instalación

1. Clonar el repositorio:
   ```bash
   git clone https://github.com/tu-usuario/ferreteria-bruzzone-erp.git
   ```
2. Instalar dependencias:
   ```bash
   npm install
   ```
3. Configurar variables de entorno:
   Copiar `.env.example` a `.env` y completar las credenciales de Firebase y la API Key de Gemini.

4. Iniciar servidor de desarrollo:
   ```bash
   npm run dev
   ```

## 📂 Estructura del Proyecto

El proyecto sigue una organización basada en **Módulos de Negocio** para facilitar el mantenimiento y la escalabilidad de cada funcionalidad por separado.

---
© 2024 Ferretería Bruzzone | Desarrollado por Sistems Nova