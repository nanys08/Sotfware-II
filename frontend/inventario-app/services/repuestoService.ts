const API_BASE_URL = "http://192.168.1.7:8080";

export type RepuestoPayload = {
  idRepuesto: string;
  nombre: string;
  cantidad: number;
  calidad: string;
  marca: string;
  estado: string;
  imagen?: string | null;
};

const handleResponse = async (resp: Response) => {
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(text || `Error ${resp.status}`);
  }
  return resp.json();
};

export const obtenerRepuestoPorId = async (idRepuesto: string) => {
  const resp = await fetch(`${API_BASE_URL}/api/repuesto/${encodeURIComponent(idRepuesto)}`);
  return handleResponse(resp);
};

export const listarRepuestos = async () => {
  const resp = await fetch(`${API_BASE_URL}/api/repuesto/listar`);
  return handleResponse(resp);
};

export const listarPorReferencia = async (idReferencia: string) => {
  const resp = await fetch(`${API_BASE_URL}/api/repuesto/referencia/${encodeURIComponent(idReferencia)}`);
  return handleResponse(resp);
};

export const registrarRepuesto = async (idReferencia: string, datos: RepuestoPayload) => {
  const resp = await fetch(
    `${API_BASE_URL}/api/repuesto/registrar/${encodeURIComponent(idReferencia)}`,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(datos) }
  );
  return handleResponse(resp);
};

export const editarRepuesto = async (
  idRepuesto: string,
  idReferencia: string,
  datos: Omit<RepuestoPayload, "referencia">
) => {
  const resp = await fetch(
    `${API_BASE_URL}/api/repuesto/editar/${encodeURIComponent(idRepuesto)}/${encodeURIComponent(idReferencia)}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...datos, referencia: { idReferencia } }),
    }
  );
  return handleResponse(resp);
};

export const eliminarCantidadRepuesto = async (idRepuesto: string, cantidad: number) => {
  const resp = await fetch(
    `${API_BASE_URL}/api/repuesto/eliminarCantidad/${encodeURIComponent(idRepuesto)}/${cantidad}`,
    { method: "PUT" }
  );
  return handleResponse(resp);
};

export const eliminarRepuesto = async (idRepuesto: string) => {
  const resp = await fetch(`${API_BASE_URL}/api/repuesto/${encodeURIComponent(idRepuesto)}`, {
    method: "DELETE",
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(text || `Error ${resp.status}`);
  }
};

export const obtenerReferenciasParaRepuesto = async () => {
  const resp = await fetch(`${API_BASE_URL}/api/referencias/activas`);
  return handleResponse(resp);
};
