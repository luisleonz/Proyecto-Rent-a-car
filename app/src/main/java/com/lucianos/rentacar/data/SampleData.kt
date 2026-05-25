package com.lucianos.rentacar.data

data class Reservation(
    val id: String,
    val time: String,
    val type: String,
    val clientName: String,
    val vehicle: String,
    val clientInitials: String,
    val status: String = "pending"
)

data class Vehicle(
    val plate: String,
    val model: String,
    val year: String,
    val color: String,
    val status: String,
    val km: String,
    val currentClient: String? = null,
    val clientInfo: String? = null
)

data class DailyKpi(
    val incomeToday: String,
    val incomeChange: String,
    val rented: Int,
    val total: Int,
    val deliveries: Int,
    val inWorkshop: Int
)

val sampleKpi = DailyKpi(
    incomeToday = "\$8,400",
    incomeChange = "+12% sem.",
    rented = 7,
    total = 14,
    deliveries = 3,
    inWorkshop = 1
)

val todayReservations = listOf(
    Reservation("1", "10:30", "Entrega", "Mariana Pérez", "Sentra · ABC-123", "MP", "urgent"),
    Reservation("2", "13:00", "Entrega", "Ricardo López", "Versa · XYZ-908", "RL"),
    Reservation("3", "15:00", "Devolución", "Lupita Cruz", "Aveo · JKL-441", "LC"),
    Reservation("4", "17:30", "Entrega", "Jorge Díaz", "Aveo · ABC-771", "JD"),
)

val tomorrowReservations = listOf(
    Reservation("5", "09:00", "Devolución", "Lupita Cruz", "Yaris · TUV-309", "LC"),
    Reservation("6", "11:00", "Entrega", "Pedro Soto", "Polo · QRS-115", "PS"),
)

val sampleFleet = listOf(
    Vehicle("ABC-123", "Nissan Sentra", "2022", "Azul", "rentado", "45,200", "M. Pérez", "vence vie"),
    Vehicle("XYZ-908", "Nissan Versa", "2023", "Blanco", "disponible", "12,100"),
    Vehicle("JKL-441", "Chevrolet Aveo", "2021", "Gris", "rentado", "78,300", "R. López", "vence hoy"),
    Vehicle("MNP-772", "Kia Rio", "2023", "Rojo", "taller", "38,400", null, "Cambio de aceite"),
    Vehicle("QRS-115", "VW Polo", "2022", "Negro", "disponible", "22,800"),
    Vehicle("TUV-309", "Toyota Yaris", "2023", "Blanco", "reservado", "8,900", null, "jue 23 · 10:00"),
)

data class MenuOption(
    val icon: String,
    val label: String,
    val sublabel: String? = null,
    val isDanger: Boolean = false
)

val moreMenuOptions = listOf(
    MenuOption("💰", "Caja / Turno", "Cierre del día"),
    MenuOption("👥", "Equipo", "4 empleados activos"),
    MenuOption("📊", "Reportes", "Semana actual"),
    MenuOption("⚙️", "Configuración"),
    MenuOption("🎧", "Soporte"),
    MenuOption("🚪", "Cerrar sesión", isDanger = true),
)
