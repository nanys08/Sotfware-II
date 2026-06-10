export interface Repuesto {
  idRepuesto: string;
  fechaRegistro: string;
  nombre: string;
  cantidad: number;
  calidad: string;
  marca: string;
  estado: string;
  imagen: string | null;
  referencia: {
    idReferencia: string;
    nombre?: string;
  };
}
