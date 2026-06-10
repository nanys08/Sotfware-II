package com.inventario.backend.service;

import com.inventario.backend.model.Repuesto;
import com.inventario.backend.model.Referencia;
import com.inventario.backend.repository.RepuestoRepository;
import com.inventario.backend.repository.ReferenciaRepository;
import com.inventario.backend.utils.ValidadorDatos;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class RepuestoService {

    private final RepuestoRepository repuestoRepository;
    private final ReferenciaRepository referenciaRepository;

    public RepuestoService(RepuestoRepository repuestoRepository, ReferenciaRepository referenciaRepository) {
        this.repuestoRepository = repuestoRepository;
        this.referenciaRepository = referenciaRepository;
    }

    // -----------------------
    // Registro 
    // -----------------------
    public Repuesto registrarRepuesto(Repuesto repuesto, String idReferencia) {
        ValidadorDatos.validarRepuesto(repuesto);

        if (repuestoRepository.existsById(repuesto.getIdRepuesto())) {
            throw new RuntimeException("El ID del repuesto ya existe");
        }

        Referencia ref = referenciaRepository.findById(idReferencia)
            .orElseThrow(() -> new RuntimeException("Referencia no encontrada"));

        repuesto.setReferencia(ref);

        // imagen ya no se guarda, se deja lo que venga en el JSON (null normalmente)
        repuesto.setFechaRegistro(LocalDateTime.now()
            .format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")));

        return repuestoRepository.save(repuesto);
    }

    // -----------------------
    // Listar
    // -----------------------
    public List<Repuesto> listarRepuestos() {
        return repuestoRepository.findAll();
    }

    public List<Repuesto> listarPorReferencia(String idReferencia) {
        return repuestoRepository.findByReferenciaIdReferencia(idReferencia);
    }

    // -----------------------
    // Obtener por ID (delegación)
    // -----------------------
    public Repuesto obtenerPorId(String id) {
        return findByIdOrThrow(id); 
    }

    // -----------------------
    // Editar
    // -----------------------
    public Repuesto editarRepuesto(String id, Repuesto cambios, String idReferencia) {
        ValidadorDatos.validarRepuesto(cambios);

        Repuesto rep = repuestoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Repuesto no encontrado"));

        rep.setNombre(cambios.getNombre());
        rep.setCantidad(cambios.getCantidad());
        rep.setCalidad(cambios.getCalidad());
        rep.setMarca(cambios.getMarca());
        rep.setEstado(cambios.getEstado());

        // imagen se respeta si viene en el JSON, pero no se guarda archivo
        rep.setImagen(cambios.getImagen());

        if (idReferencia != null && !idReferencia.isBlank()) {
            Referencia ref = referenciaRepository.findById(idReferencia)
                    .orElseThrow(() -> new RuntimeException("Referencia no encontrada"));
            rep.setReferencia(ref);
        }

        return repuestoRepository.save(rep);
    }
   
     //Eliminar cantidad

    public Repuesto eliminarCantidad(String idRepuesto, int cantidadEliminar) {

        Repuesto rep = repuestoRepository.findById(idRepuesto)
                .orElseThrow(() -> new RuntimeException("Repuesto no encontrado"));

        if (rep.getCantidad() < cantidadEliminar) {
            throw new RuntimeException("No hay suficientes unidades para eliminar");
        }

        rep.setCantidad(rep.getCantidad() - cantidadEliminar);

        return repuestoRepository.save(rep);
    }

    // -----------------------
    // Eliminar repuesto completo
    // -----------------------
    public void eliminarRepuesto(String id) {
        Repuesto rep = repuestoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Repuesto no encontrado"));
        repuestoRepository.delete(rep);
    }

    // -----------------------
    // Helpers
    // -----------------------
    public Repuesto findByIdOrThrow(String id) {
        return repuestoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Repuesto no encontrado"));
    }

    public Repuesto save(Repuesto repuesto) {
        return repuestoRepository.save(repuesto);
    }
}











