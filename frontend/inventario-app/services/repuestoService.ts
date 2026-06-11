import { api } from '../api';

export type RepuestoPayload = {
  idRepuesto: string;
  nombre: string;
  cantidad: number;
  calidad: string;
  marca: string;
  estado: string;
  imagen?: string | null;
};

export const obtenerRepuestoPorId = async (idRepuesto: string) => {
  const response = await api.get(`/api/repuesto/${encodeURIComponent(idRepuesto)}`);
  return response.data;
};

export const listarRepuestos = async () => {
  const response = await api.get('/api/repuesto/listar');
  return response.data;
};

export const listarPorReferencia = async (idReferencia: string) => {
  const response = await api.get(`/api/repuesto/referencia/${encodeURIComponent(idReferencia)}`);
  return response.data;
};

export const registrarRepuesto = async (idReferencia: string, datos: RepuestoPayload) => {
  const response = await api.post(
    `/api/repuesto/registrar/${encodeURIComponent(idReferencia)}`,
    datos
  );
  return response.data;
};

export const editarRepuesto = async (
  idRepuesto: string,
  idReferencia: string,
  datos: Omit<RepuestoPayload, 'referencia'>
) => {
  const response = await api.put(
    `/api/repuesto/editar/${encodeURIComponent(idRepuesto)}/${encodeURIComponent(idReferencia)}`,
    { ...datos, referencia: { idReferencia } }
  );
  return response.data;
};

export const eliminarCantidadRepuesto = async (idRepuesto: string, cantidad: number) => {
  const response = await api.put(
    `/api/repuesto/eliminarCantidad/${encodeURIComponent(idRepuesto)}/${cantidad}`
  );
  return response.data;
};

export const eliminarRepuesto = async (idRepuesto: string) => {
  await api.delete(`/api/repuesto/${encodeURIComponent(idRepuesto)}`);
};

export const obtenerReferenciasParaRepuesto = async () => {
  const response = await api.get('/api/referencias/activas');
  return response.data;
};
