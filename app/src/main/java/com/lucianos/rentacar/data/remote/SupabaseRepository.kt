package com.lucianos.rentacar.data.remote

import com.lucianos.rentacar.data.Reservation
import com.lucianos.rentacar.data.Vehicle
import io.github.jan.supabase.auth.auth
import io.github.jan.supabase.auth.providers.builtin.Email
import io.github.jan.supabase.postgrest.from

object SupabaseRepository {

    // ── Vehicles ───────────────────────────────────────────────────────────────

    suspend fun fetchVehicles(): List<Vehicle> {
        return supabase.from("vehicles")
            .select()
            .decodeList<VehicleDto>()
            .map { it.toDomain() }
    }

    suspend fun updateVehicleStatus(plate: String, status: String) {
        supabase.from("vehicles")
            .update({ set("status", status) }) {
                filter { eq("plate", plate) }
            }
    }

    // ── Reservations ───────────────────────────────────────────────────────────

    suspend fun fetchReservationsByDate(date: String): List<Reservation> {
        return supabase.from("reservations")
            .select {
                filter { eq("reservation_date", date) }
            }
            .decodeList<ReservationDto>()
            .sortedBy { it.time }
            .map { it.toDomain() }
    }

    // ── Auth ───────────────────────────────────────────────────────────────────

    suspend fun signIn(email: String, password: String): EmployeeDto? {
        supabase.auth.signInWith(Email) {
            this.email = email
            this.password = password
        }
        return fetchEmployee(email)
    }

    suspend fun signOut() {
        supabase.auth.signOut()
    }

    private suspend fun fetchEmployee(email: String): EmployeeDto? {
        return supabase.from("employees")
            .select {
                filter { eq("email", email) }
                limit(1)
            }
            .decodeSingleOrNull<EmployeeDto>()
    }
}
