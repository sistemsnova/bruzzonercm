// src/lib/arcaService.ts

/**
 * Servicio ARCA (Ex AFIP) Actualizado para compatibilidad total con los módulos.
 */

// Función para buscar datos de un CUIT
// Acepta CUIT y un tipo (cliente/proveedor) como piden los módulos
export const fetchArcaDataByCuit = async (cuit: string, type?: string) => {
  console.log(`Buscando ${type || 'entidad'} en ARCA: ${cuit}`);
  
  // Devolvemos el objeto completo con todos los campos que Clientes.tsx y Suppliers.tsx piden
  return {
    name: "Empresa o Persona Simulada",
    cuit: cuit,
    address: "Calle Falsa 123, CABA",
    ivaCondition: "Responsable Inscripto",
    status: "Activo",
    email: "contacto@simulado.com", // Requerido por Clientes/Proveedores
    phone: "1122334455"           // Requerido por Clientes/Proveedores
  };
};

// Función para enviar nómina/sueldos
// Acepta el usuario y el monto neto como pide Users.tsx
export const submitPayrollToArca = async (user: any, net?: number) => {
  console.log("Enviando nómina de:", user.name, "Monto:", net);
  
  // Devolvemos el objeto con todos los campos que Users.tsx espera
  return {
    success: true,
    cae: "74231859620145",
    vto: "2025-12-31",
    message: "Comprobante autorizado exitosamente", // Requerido por Users.tsx
    protocolNumber: "AR-9923-B",                    // Requerido por Users.tsx
    cuil: user.cuil || "20-00000000-9"              // Requerido por Users.tsx
  };
};

// Objeto por defecto para compatibilidad
export const arcaService = {
  fetchArcaDataByCuit,
  submitPayrollToArca,
  getStatus: async () => ({ status: 'online' })
};