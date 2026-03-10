import axios from 'axios';

export const api = axios.create({
  baseURL: 'https://sotfware-ii.onrender.com', // 👈 IP del backend (cámbiala si es otra)
  timeout: 5000,
});

