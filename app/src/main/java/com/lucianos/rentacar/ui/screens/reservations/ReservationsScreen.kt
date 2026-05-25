package com.lucianos.rentacar.ui.screens.reservations

import androidx.compose.foundation.background
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.CalendarMonth
import androidx.compose.material.icons.filled.FilterList
import androidx.compose.material3.Divider
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import com.lucianos.rentacar.data.Reservation
import com.lucianos.rentacar.data.todayReservations
import com.lucianos.rentacar.data.tomorrowReservations
import com.lucianos.rentacar.ui.components.AvatarCircle
import com.lucianos.rentacar.ui.components.StatusChip
import com.lucianos.rentacar.ui.theme.LucianosBackground
import com.lucianos.rentacar.ui.theme.LucianosHairline
import com.lucianos.rentacar.ui.theme.LucianosInk
import com.lucianos.rentacar.ui.theme.LucianosInk2
import com.lucianos.rentacar.ui.theme.LucianosInk3
import com.lucianos.rentacar.ui.theme.LucianosPrimary
import com.lucianos.rentacar.ui.theme.LucianosPrimarySoft
import com.lucianos.rentacar.ui.theme.MonoTime

@Composable
fun ReservationsScreen(navController: NavController) {
    val dayFilters = listOf("Hoy", "Mañana", "Mié", "Jue", "Vie", "Sáb")
    var selectedDay by remember { mutableStateOf("Hoy") }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(LucianosBackground)
    ) {
        Column(modifier = Modifier.fillMaxSize()) {
            // AppBar
            ReservationsAppBar()

            // Day filter chips (horizontal scroll)
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Color.White)
                    .horizontalScroll(rememberScrollState())
                    .padding(horizontal = 16.dp, vertical = 10.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                dayFilters.forEach { day ->
                    DayFilterChip(
                        label = day,
                        isSelected = selectedDay == day,
                        onClick = { selectedDay = day }
                    )
                }
            }

            Divider(color = LucianosHairline, thickness = 1.dp)

            // List content
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .verticalScroll(rememberScrollState())
                    .padding(horizontal = 16.dp)
            ) {
                Spacer(modifier = Modifier.height(16.dp))

                // Today section
                DaySection(
                    header = "Hoy · martes 21 mayo",
                    reservations = todayReservations
                )

                Spacer(modifier = Modifier.height(20.dp))

                // Tomorrow section
                DaySection(
                    header = "Mañana · miércoles 22",
                    reservations = tomorrowReservations
                )

                Spacer(modifier = Modifier.height(80.dp))
            }
        }

        // FAB
        FloatingActionButton(
            onClick = { /* new reservation */ },
            modifier = Modifier
                .align(Alignment.BottomEnd)
                .padding(end = 16.dp, bottom = 16.dp),
            containerColor = LucianosPrimary,
            contentColor = Color.White,
            shape = CircleShape
        ) {
            Icon(Icons.Filled.Add, contentDescription = "Nueva reserva")
        }
    }
}

@Composable
private fun ReservationsAppBar() {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(Color.White)
            .statusBarsPadding()
            .padding(horizontal = 16.dp, vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text = "Reservas",
            fontSize = 22.sp,
            fontWeight = FontWeight.Bold,
            fontFamily = FontFamily.Serif,
            color = LucianosInk,
            modifier = Modifier.weight(1f)
        )
        IconButton(onClick = {}) {
            Icon(
                imageVector = Icons.Filled.CalendarMonth,
                contentDescription = "Calendario",
                tint = LucianosInk2
            )
        }
        IconButton(onClick = {}) {
            Icon(
                imageVector = Icons.Filled.FilterList,
                contentDescription = "Filtrar",
                tint = LucianosInk2
            )
        }
    }
}

@Composable
private fun DayFilterChip(label: String, isSelected: Boolean, onClick: () -> Unit) {
    Box(
        modifier = Modifier
            .clip(RoundedCornerShape(20.dp))
            .background(if (isSelected) LucianosPrimary else Color(0xFFF0F0F0))
            .padding(horizontal = 14.dp, vertical = 7.dp),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = label,
            color = if (isSelected) Color.White else LucianosInk2,
            fontSize = 13.sp,
            fontWeight = if (isSelected) FontWeight.SemiBold else FontWeight.Normal,
            fontFamily = FontFamily.SansSerif
        )
    }
}

@Composable
private fun DaySection(header: String, reservations: List<Reservation>) {
    Text(
        text = header,
        fontSize = 13.sp,
        fontWeight = FontWeight.SemiBold,
        color = LucianosInk3,
        fontFamily = FontFamily.SansSerif,
        letterSpacing = 0.5.sp
    )

    Spacer(modifier = Modifier.height(10.dp))

    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        color = Color.White,
        shadowElevation = 0.dp,
        border = androidx.compose.foundation.BorderStroke(1.dp, LucianosHairline)
    ) {
        Column {
            reservations.forEachIndexed { index, reservation ->
                ReservationCard(reservation = reservation)
                if (index < reservations.size - 1) {
                    Divider(
                        color = LucianosHairline,
                        thickness = 1.dp,
                        modifier = Modifier.padding(horizontal = 16.dp)
                    )
                }
            }
        }
    }
}

@Composable
private fun ReservationCard(reservation: Reservation) {
    val isUrgent = reservation.status == "urgent"

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 14.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        // Time strip
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier.width(52.dp)
        ) {
            Text(
                text = reservation.time,
                style = MonoTime,
                color = if (isUrgent) com.lucianos.rentacar.ui.theme.LucianosDanger else LucianosInk3
            )
        }

        Spacer(modifier = Modifier.width(12.dp))

        // Avatar
        AvatarCircle(
            initials = reservation.clientInitials,
            accent = if (isUrgent) com.lucianos.rentacar.ui.theme.LucianosDanger else LucianosPrimary,
            size = 40.dp
        )

        Spacer(modifier = Modifier.width(12.dp))

        // Details
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = reservation.clientName,
                fontSize = 14.sp,
                fontWeight = FontWeight.SemiBold,
                color = LucianosInk,
                fontFamily = FontFamily.SansSerif
            )
            Spacer(modifier = Modifier.height(2.dp))
            Text(
                text = reservation.vehicle,
                fontSize = 12.sp,
                color = LucianosInk3,
                fontFamily = FontFamily.SansSerif
            )
        }

        Spacer(modifier = Modifier.width(8.dp))

        // Type chip
        StatusChip(status = reservation.type.lowercase())
    }
}
