package com.inventario.backend.utils;

import com.inventario.backend.model.Usuario;
import com.inventario.backend.model.Referencia;
import com.inventario.backend.model.Repuesto;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class ValidadorDatos {

    private static final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    // ----------------------------------------------------
    // VALIDACIONES DE LOGIN
    // ----------------------------------------------------
    public static void validarCredenciales(Usuario usuario, String contrasenaIngresada) {
        if (usuario == null) {
            throw new IllegalArgumentException("El usuario no existe.");
        }

        if (contrasenaIngresada == null || contrasenaIngresada.trim().isEmpty()) {
            throw new IllegalArgumentException("La contraseña no puede estar vacía.");
        }

        if (!passwordEncoder.matches(contrasenaIngresada, usuario.getContrasena())) {
            throw new IllegalArgumentException("Contraseña incorrecta.");
        }
    }

    // ----------------------------------------------------
    // VALIDACIONES DE USUARIO
    // ----------------------------------------------------
    public static void validarUsuario(Usuario usuario) {

        if (usuario == null) {
            throw new IllegalArgumentException("El usuario no puede ser nulo.");
        }

        if (usuario.getNombre() == null || usuario.getNombre().trim().isEmpty()) {
            throw new IllegalArgumentException("El nombre no puede estar vacío.");
        }

        if (usuario.getCedula() == null || !usuario.getCedula().matches("\\d{6,10}")) {
            throw new IllegalArgumentException("La cédula debe contener entre 6 y 10 dígitos numéricos.");
        }

        if (usuario.getCorreo() == null ||
            !usuario.getCorreo().matches("^[\\w-.]+@[\\w-]+\\.[a-zA-Z]{2,}$")) {
            throw new IllegalArgumentException("El correo electrónico no es válido.");
        }

        if (usuario.getContrasena() == null || usuario.getContrasena().length() < 6) {
            throw new IllegalArgumentException("La contraseña debe tener al menos 6 caracteres.");
        }

        if (usuario.getRol() == null || usuario.getRol().trim().isEmpty()) {
            throw new IllegalArgumentException("El rol es obligatorio.");
        }

        String rol = usuario.getRol().toUpperCase();
        if (!rol.equals("ADMIN") && !rol.equals("TECNICO")) {
            throw new IllegalArgumentException("El rol debe ser ADMIN o TECNICO.");
        }
    }

    // --------------------------------------------------------------
    // VALIDAR REFERENCIA
    // --------------------------------------------------------------
    public static void validarReferencia(Referencia referencia) {
        if (referencia == null) {
            throw new IllegalArgumentException("La referencia no puede ser nula.");
        }

        if (referencia.getIdReferencia() == null || referencia.getIdReferencia().trim().isEmpty()) {
            throw new IllegalArgumentException("El ID de la referencia no puede estar vacío.");
        }

        if (!referencia.getIdReferencia().matches("^RF\\d+$")) {
            throw new IllegalArgumentException("El ID de referencia debe iniciar con 'RF' seguido de números.");
        }

        if (referencia.getNombre() == null || referencia.getNombre().trim().isEmpty()) {
            throw new IllegalArgumentException("El nombre no puede estar vacío.");
        }
    }

    // --------------------------------------------------------------
    // VALIDAR REPUESTO
    // --------------------------------------------------------------
    public static void validarRepuesto(Repuesto repuesto) {
        if (repuesto == null) {
            throw new IllegalArgumentException("El repuesto no puede ser nulo.");
        }

        if (repuesto.getIdRepuesto() == null || repuesto.getIdRepuesto().trim().isEmpty()) {
            throw new IllegalArgumentException("El ID del repuesto no puede estar vacío.");
        }

        if (!repuesto.getIdRepuesto().toUpperCase().startsWith("RE")) {
            throw new IllegalArgumentException("El ID del repuesto debe iniciar con 'RE'.");
        }

        if (repuesto.getNombre() == null || repuesto.getNombre().trim().isEmpty()) {
            throw new IllegalArgumentException("El nombre no puede estar vacío.");
        }

        if (repuesto.getCantidad() == null || repuesto.getCantidad() < 0) {
            throw new IllegalArgumentException("La cantidad debe ser un número positivo.");
        }

        if (repuesto.getCalidad() == null || repuesto.getCalidad().trim().isEmpty()) {
            throw new IllegalArgumentException("La calidad no puede estar vacía.");
        }

        if (repuesto.getMarca() == null || repuesto.getMarca().trim().isEmpty()) {
            throw new IllegalArgumentException("La marca no puede estar vacía.");
        }

        if (repuesto.getEstado() == null || repuesto.getEstado().trim().isEmpty()) {
            throw new IllegalArgumentException("El estado no puede estar vacío.");
        }

        if (repuesto.getReferencia() == null) {
            throw new IllegalArgumentException("Debe asignar una referencia válida al repuesto.");
        }
    }
}



