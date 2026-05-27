package com.lucianos.rentacar.data

object EntregaState {
    var reservationId: String = ""
    var docLic: Boolean = false
    var docIne: Boolean = false
    var docDom: Boolean = false
    var docTarj: Boolean = false
    var signed: Boolean = false
    var damageCount: Int = 0
    var photoCount: Int = 0
    var fuelLevel: String = "3/4"
    var kmStart: String = "0"
    var paymentMethod: String = "cash"
    var amountReceived: String = ""

    fun reset(resId: String) {
        reservationId = resId
        docLic = false; docIne = false; docDom = false; docTarj = false
        signed = false; damageCount = 0; photoCount = 0
        fuelLevel = "3/4"; kmStart = "0"
        paymentMethod = "cash"; amountReceived = ""
    }

    val allDocsOk get() = docLic && docIne && docDom && docTarj
}

object DevolucionState {
    var reservationId: String = ""
    var kmReturn: String = "0"
    var fuelLevel: String = "1/2"
    var newDamageCount: Int = 0
    var returnMethod: String = "cash"
    var photoTaken: Boolean = false
    var signed: Boolean = false

    fun reset(resId: String) {
        reservationId = resId
        kmReturn = "0"; fuelLevel = "1/2"; newDamageCount = 0
        returnMethod = "cash"; photoTaken = false; signed = false
    }

    val kmExtra: Int get() {
        val km = kmReturn.toIntOrNull() ?: 0
        val recorrido = km - 45200
        return maxOf(0, recorrido - 600)
    }
    val fuelDeficit: Int get() = mapOf("E" to 4, "1/4" to 3, "1/2" to 2, "3/4" to 0, "F" to 0)[fuelLevel] ?: 0
    val extraCharges: Int get() = kmExtra * 3 + fuelDeficit * 80 + newDamageCount * 800
    val depositAmount: Int get() = 2000
    val toReturn: Int get() = maxOf(0, depositAmount - extraCharges)
    val toCharge: Int get() = maxOf(0, extraCharges - depositAmount)
}
