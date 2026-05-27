package com.lucianos.rentacar.data

object TurnoState {
    var isOpen: Boolean = false
    var turnoId: String = "T1"
    var horario: String = "09:00 — 15:00"
    var fondoInicial: Int = 3000
    var efectivoRecibido: Int = 8200
    var speiRecibido: Int = 6050
    var movimientos: Int = 11
    var entregas: Int = 4
    var retornos: Int = 2
    val totalRecibido: Int get() = efectivoRecibido + speiRecibido

    // Conteo de cierre (denominaciones)
    var billetes500: Int = 0
    var billetes200: Int = 0
    var billetes100: Int = 0
    var billetes50: Int = 0
    var billetes20: Int = 0

    val totalContado: Int get() =
        billetes500 * 500 + billetes200 * 200 + billetes100 * 100 +
        billetes50 * 50 + billetes20 * 20

    val esperadoEnCaja: Int get() = efectivoRecibido
    val diferencia: Int get() = totalContado - fondoInicial - esperadoEnCaja

    var justificacionCausa: String = ""
    var justificacionNota: String = ""

    fun resetConteo() {
        billetes500 = 22; billetes200 = 1
        billetes100 = 0; billetes50 = 0; billetes20 = 0
    }

    fun openTurno() {
        isOpen = true
        fondoInicial = 3000
        billetes500 = 0; billetes200 = 0; billetes100 = 0
        billetes50 = 0; billetes20 = 0
        justificacionCausa = ""; justificacionNota = ""
    }
}
