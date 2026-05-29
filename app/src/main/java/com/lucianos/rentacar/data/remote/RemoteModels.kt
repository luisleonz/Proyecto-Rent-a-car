package com.lucianos.rentacar.data.remote

import com.lucianos.rentacar.data.Reservation
import com.lucianos.rentacar.data.Vehicle
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

// ─── Vehicle ──────────────────────────────────────────────────────────────────

@Serializable
data class VehicleDto(
    val id: String? = null,
    val plate: String,
    val model: String,
    val year: String,
    val color: String,
    val status: String,
    val km: String,
    @SerialName("current_client") val currentClient: String? = null,
    @SerialName("client_info") val clientInfo: String? = null
) {
    fun toDomain() = Vehicle(
        plate = plate,
        model = model,
        year = year,
        color = color,
        status = status,
        km = km,
        currentClient = currentClient,
        clientInfo = clientInfo
    )
}

// ─── Reservation ──────────────────────────────────────────────────────────────

@Serializable
data class ReservationDto(
    val id: String,
    val time: String,
    val type: String,
    @SerialName("client_name") val clientName: String,
    val vehicle: String,
    @SerialName("client_initials") val clientInitials: String,
    val status: String = "pending",
    @SerialName("reservation_date") val reservationDate: String
) {
    fun toDomain() = Reservation(
        id = id,
        time = time,
        type = type,
        clientName = clientName,
        vehicle = vehicle,
        clientInitials = clientInitials,
        status = status
    )
}

// ─── Employee ─────────────────────────────────────────────────────────────────

@Serializable
data class EmployeeDto(
    val id: String? = null,
    val email: String,
    @SerialName("first_name") val firstName: String,
    @SerialName("full_name") val fullName: String,
    val role: String,
    val branch: String,
    val initials: String
)
