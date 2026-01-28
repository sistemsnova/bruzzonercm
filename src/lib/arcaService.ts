
import { Client, Supplier, InternalUser } from '../types';

// Mock ARCA_API_KEY for demonstration. In a real app, this would be secured.
const ARCA_API_KEY = process.env.ARCA_API_KEY || "YOUR_ARCA_DEMO_KEY"; 

interface ArcaClientData {
  name: string;
  cuit: string;
  email: string;
  phone: string; // WhatsApp can be derived from phone
  address?: string;
  ivaCondition?: string;
}

interface ArcaSupplierData {
  name: string;
  cuit: string;
  email: string;
  phone: string;
  address?: string;
}

/**
 * Simulates submitting payroll data to ARCA (Libro de Sueldos Digital).
 */
export async function submitPayrollToArca(userData: InternalUser, amount: number) {
  await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate processing

  // Logical validation simulation
  if (amount <= 0) throw new Error("El importe a liquidar debe ser mayor a cero.");

  return {
    status: 'success',
    cuil: '20-' + userData.id + '-9',
    protocolNumber: 'LSD-' + Math.floor(Math.random() * 1000000),
    timestamp: new Date().toISOString(),
    message: "Liquidación validada correctamente en Libro de Sueldos Digital."
  };
}

/**
 * Simulates fetching data from an ARCA-like service based on CUIT.
 */
export async function fetchArcaDataByCuit(cuit: string, type: 'client' | 'supplier'): Promise<ArcaClientData | ArcaSupplierData> {
  await new Promise(resolve => setTimeout(resolve, Math.random() * 1500 + 500)); 

  if (!ARCA_API_KEY || ARCA_API_KEY.includes("DEMO_KEY") || ARCA_API_KEY.includes("REPLACE-ME")) {
    console.warn("ARCA Service: Using a demo API key. Replace with a real one for production.");
  }

  const mockData: { [cuit: string]: { client?: ArcaClientData, supplier?: ArcaSupplierData } } = {
    '20-33445566-7': {
      client: {
        name: 'Juan Perez S.R.L.',
        cuit: '20-33445566-7',
        email: 'contacto@juanperez.com',
        phone: '5491155551234',
        address: 'Calle Falsa 123',
        ivaCondition: 'Responsable Inscripto',
      }
    },
    '30-11223344-9': {
      client: {
        name: 'Constructora del Norte S.A.',
        cuit: '30-11223344-9',
        email: 'info@cdn.com.ar',
        phone: '5491144445678',
        address: 'Av. Libertador 789',
        ivaCondition: 'Responsable Inscripto',
      },
      supplier: {
        name: 'Constructora del Norte S.A.',
        cuit: '30-11223344-9',
        email: 'compras@cdn.com.ar',
        phone: '5491144445678',
        address: 'Av. Libertador 789',
      }
    },
    '30-50001234-5': {
      supplier: {
        name: 'Sinteplast S.A.',
        cuit: '30-50001234-5',
        email: 'ventas@sinteplast.com.ar',
        phone: '5491133339876',
        address: 'Ruta 3 Km 50',
      }
    },
  };

  const data = mockData[cuit];
  if (data && data[type]) {
    return data[type]!;
  } else {
    throw new Error(`CUIT '${cuit}' no encontrado en ARCA para tipo '${type}'.`);
  }
}
