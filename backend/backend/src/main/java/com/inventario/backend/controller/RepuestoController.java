package com.inventario.backend.controller;

import com.inventario.backend.model.Repuesto;
import com.inventario.backend.service.RepuestoService;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/repuesto")
@CrossOrigin("*")
public class RepuestoController {

    private final RepuestoService repuestoService;

    public RepuestoController(RepuestoService repuestoService) {
        this.repuestoService = repuestoService;
    }
    // ----------------------------
    // REGISTRAR SIN IMAGEN
    // ----------------------------
    @PostMapping("/registrar/{idReferencia}")
    public ResponseEntity<?> registrar(
            @RequestBody Repuesto repuesto,
            @PathVariable String idReferencia) {

        try {
            // AHORA SOLO ENVÍA LOS DOS PARÁMETROS CORRECTOS
            Repuesto creado = repuestoService.registrarRepuesto(repuesto, idReferencia);
            return ResponseEntity.ok(creado);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }


    // ----------------------------
    // LISTAR TODO
    // ----------------------------
    @GetMapping("/listar")
    public ResponseEntity<List<Repuesto>> listar() {
        return ResponseEntity.ok(repuestoService.listarRepuestos());
    }

    // ----------------------------
    // LISTAR POR REFERENCIA
    // ----------------------------
    @GetMapping("/referencia/{idRef}")
    public ResponseEntity<List<Repuesto>> listarPorReferencia(@PathVariable String idRef) {
        return ResponseEntity.ok(repuestoService.listarPorReferencia(idRef));
    }

    // ----------------------------
    // OBTENER POR ID
    // ----------------------------
    @GetMapping("/{id}")
    public ResponseEntity<?> obtenerPorId(@PathVariable String id) {
        System.out.println("📌 Buscando repuesto con ID: " + id);

        try {
            Repuesto r = repuestoService.obtenerPorId(id);
            return ResponseEntity.ok(r);
        } catch (Exception e) {
            System.out.println("🔥 ERROR al obtener repuesto: " + e.getMessage());
            return ResponseEntity.status(500).body(e.getMessage());
        }
    }

    // ----------------------------
    // EDITAR SIN IMAGEN
    // ----------------------------
    @PutMapping("/editar/{idRepuesto}/{idReferencia}")
    public ResponseEntity<?> editarRepuesto(
            @PathVariable String idRepuesto,
            @PathVariable String idReferencia,
            @RequestBody Repuesto repuesto) {

        try {
            Repuesto actualizado = repuestoService.editarRepuesto(idRepuesto, repuesto, idReferencia);
            return ResponseEntity.ok(actualizado);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }


    // ----------------------------
    // ELIMINAR CANTIDAD
    // ----------------------------
    @PutMapping("/eliminarCantidad/{id}/{cantidad}")
    public ResponseEntity<?> eliminarCantidad(@PathVariable String id,
                                              @PathVariable int cantidad) {
        try {
            Repuesto r = repuestoService.eliminarCantidad(id, cantidad);
            return ResponseEntity.ok(r);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // ----------------------------
    // ELIMINAR REPUESTO COMPLETO
    // ----------------------------
    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminar(@PathVariable String id) {
        try {
            repuestoService.eliminarRepuesto(id);
            return ResponseEntity.ok("Repuesto eliminado correctamente.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
