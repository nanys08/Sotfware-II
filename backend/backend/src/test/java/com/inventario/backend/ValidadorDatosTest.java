package com.inventario.backend;

import com.inventario.backend.model.Referencia;
import com.inventario.backend.model.Repuesto;
import com.inventario.backend.model.Usuario;
import com.inventario.backend.utils.ValidadorDatos;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Pruebas unitarias de las reglas de negocio de validacion.
 *
 * Estas pruebas se ejecutan automaticamente en el pipeline de CI
 * (Jenkins / Azure) mediante "mvn test". Son pruebas puras (no levantan
 * el contexto de Spring ni la base de datos), por lo que son rapidas y
 * deterministas: ideales para la etapa de "Pruebas Automatizadas" del
 * flujo DevOps y para alimentar la metrica DORA de "Tasa de Fallos".
 */
class ValidadorDatosTest {

    // ------------------------------------------------------------------
    // Helpers para construir objetos validos por defecto
    // ------------------------------------------------------------------
    private Usuario usuarioValido() {
        Usuario u = new Usuario();
        u.setNombre("Ana Gomez");
        u.setCedula("1234567");
        u.setCorreo("ana@empresa.com");
        u.setContrasena("secreta123");
        u.setRol("ADMIN");
        return u;
    }

    private Referencia referenciaValida() {
        return new Referencia("RF100", "Bomba de agua", true);
    }

    private Repuesto repuestoValido() {
        Repuesto r = new Repuesto();
        r.setIdRepuesto("RE200");
        r.setNombre("Filtro de aceite");
        r.setCantidad(10);
        r.setCalidad("NUEVO");
        r.setMarca("Bosch");
        r.setEstado("EN_BODEGA");
        r.setReferencia(referenciaValida());
        return r;
    }

    // ==================================================================
    @Nested
    @DisplayName("Validacion de usuarios")
    class UsuarioTests {

        @Test
        @DisplayName("Un usuario completo y bien formado no lanza excepcion")
        void usuarioValidoPasa() {
            assertDoesNotThrow(() -> ValidadorDatos.validarUsuario(usuarioValido()));
        }

        @Test
        @DisplayName("Usuario nulo es rechazado")
        void usuarioNuloFalla() {
            assertThrows(IllegalArgumentException.class,
                    () -> ValidadorDatos.validarUsuario(null));
        }

        @Test
        @DisplayName("Cedula no numerica es rechazada")
        void cedulaInvalidaFalla() {
            Usuario u = usuarioValido();
            u.setCedula("abc123");
            assertThrows(IllegalArgumentException.class,
                    () -> ValidadorDatos.validarUsuario(u));
        }

        @Test
        @DisplayName("Correo mal formado es rechazado")
        void correoInvalidoFalla() {
            Usuario u = usuarioValido();
            u.setCorreo("correo-sin-arroba");
            assertThrows(IllegalArgumentException.class,
                    () -> ValidadorDatos.validarUsuario(u));
        }

        @Test
        @DisplayName("Contrasena demasiado corta es rechazada")
        void contrasenaCortaFalla() {
            Usuario u = usuarioValido();
            u.setContrasena("123");
            assertThrows(IllegalArgumentException.class,
                    () -> ValidadorDatos.validarUsuario(u));
        }

        @Test
        @DisplayName("Rol distinto de ADMIN/TECNICO es rechazado")
        void rolInvalidoFalla() {
            Usuario u = usuarioValido();
            u.setRol("SUPERUSUARIO");
            assertThrows(IllegalArgumentException.class,
                    () -> ValidadorDatos.validarUsuario(u));
        }
    }

    // ==================================================================
    @Nested
    @DisplayName("Validacion de credenciales (login)")
    class CredencialTests {

        @Test
        @DisplayName("Contrasena correcta valida el login")
        void loginCorrecto() {
            Usuario u = usuarioValido();
            u.setContrasena(new BCryptPasswordEncoder().encode("secreta123"));
            assertDoesNotThrow(() -> ValidadorDatos.validarCredenciales(u, "secreta123"));
        }

        @Test
        @DisplayName("Contrasena incorrecta rechaza el login")
        void loginIncorrecto() {
            Usuario u = usuarioValido();
            u.setContrasena(new BCryptPasswordEncoder().encode("secreta123"));
            assertThrows(IllegalArgumentException.class,
                    () -> ValidadorDatos.validarCredenciales(u, "claveErronea"));
        }

        @Test
        @DisplayName("Usuario inexistente rechaza el login")
        void loginUsuarioNulo() {
            assertThrows(IllegalArgumentException.class,
                    () -> ValidadorDatos.validarCredenciales(null, "secreta123"));
        }
    }

    // ==================================================================
    @Nested
    @DisplayName("Validacion de referencias")
    class ReferenciaTests {

        @Test
        @DisplayName("Referencia valida pasa")
        void referenciaValidaPasa() {
            assertDoesNotThrow(() -> ValidadorDatos.validarReferencia(referenciaValida()));
        }

        @Test
        @DisplayName("ID que no inicia con RF es rechazado")
        void idReferenciaInvalidoFalla() {
            Referencia r = referenciaValida();
            r.setIdReferencia("XX100");
            assertThrows(IllegalArgumentException.class,
                    () -> ValidadorDatos.validarReferencia(r));
        }
    }

    // ==================================================================
    @Nested
    @DisplayName("Validacion de repuestos")
    class RepuestoTests {

        @Test
        @DisplayName("Repuesto valido pasa")
        void repuestoValidoPasa() {
            assertDoesNotThrow(() -> ValidadorDatos.validarRepuesto(repuestoValido()));
        }

        @Test
        @DisplayName("Cantidad negativa es rechazada")
        void cantidadNegativaFalla() {
            Repuesto r = repuestoValido();
            r.setCantidad(-5);
            assertThrows(IllegalArgumentException.class,
                    () -> ValidadorDatos.validarRepuesto(r));
        }

        @Test
        @DisplayName("ID que no inicia con RE es rechazado")
        void idRepuestoInvalidoFalla() {
            Repuesto r = repuestoValido();
            r.setIdRepuesto("ZZ200");
            assertThrows(IllegalArgumentException.class,
                    () -> ValidadorDatos.validarRepuesto(r));
        }

        @Test
        @DisplayName("Repuesto sin referencia es rechazado")
        void repuestoSinReferenciaFalla() {
            Repuesto r = repuestoValido();
            r.setReferencia(null);
            assertThrows(IllegalArgumentException.class,
                    () -> ValidadorDatos.validarRepuesto(r));
        }
    }
}
