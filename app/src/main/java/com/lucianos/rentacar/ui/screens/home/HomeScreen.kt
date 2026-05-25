package com.lucianos.rentacar.ui.screens.home

import androidx.compose.foundation.background
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
import androidx.compose.material.icons.filled.Build
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material3.Divider
import androidx.compose.material3.Icon
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import com.lucianos.rentacar.data.sampleKpi
import com.lucianos.rentacar.data.todayReservations
import com.lucianos.rentacar.navigation.Screen
import com.lucianos.rentacar.ui.components.AvatarCircle
import com.lucianos.rentacar.ui.components.DarkHeroCard
import com.lucianos.rentacar.ui.components.SectionEyebrow
import com.lucianos.rentacar.ui.components.TimelineItem
import com.lucianos.rentacar.ui.theme.LucianosBackground
import com.lucianos.rentacar.ui.theme.LucianosHairline
import com.lucianos.rentacar.ui.theme.LucianosInk
import com.lucianos.rentacar.ui.theme.LucianosInk2
import com.lucianos.rentacar.ui.theme.LucianosInk3
import com.lucianos.rentacar.ui.theme.LucianosPrimary
import com.lucianos.rentacar.ui.theme.LucianosWarn
import com.lucianos.rentacar.ui.theme.LucianosWarnSoft
import com.lucianos.rentacar.ui.theme.MonoAmount
import com.lucianos.rentacar.ui.theme.SerifItalicGreeting

@Composable
fun HomeScreen(navController: NavController) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(LucianosBackground)
    ) {
        // Custom AppBar
        HomeAppBar()

        // Scrollable content
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 16.dp)
        ) {
            Spacer(modifier = Modifier.height(16.dp))

            // Dark KPI card
            DarkHeroCard {
                KpiHeroContent(navController)
            }

            Spacer(modifier = Modifier.height(20.dp))

            // Agenda section
            AgendaSection(navController)

            Spacer(modifier = Modifier.height(16.dp))

            // Alert card
            AlertCard()

            Spacer(modifier = Modifier.height(24.dp))
        }
    }
}

@Composable
private fun HomeAppBar() {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(Color.White)
            .statusBarsPadding()
            .padding(horizontal = 16.dp, vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Row(verticalAlignment = Alignment.Baseline) {
                Text(
                    text = "Buenos días, ",
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Normal,
                    fontFamily = FontFamily.SansSerif,
                    color = LucianosInk
                )
                Text(
                    text = "Luciano",
                    style = SerifItalicGreeting,
                    color = LucianosPrimary
                )
            }
            Text(
                text = "Martes 21 de mayo · 12 movimientos hoy",
                fontSize = 12.sp,
                color = LucianosInk3,
                fontFamily = FontFamily.SansSerif
            )
        }

        // Bell with orange dot
        Box(modifier = Modifier.size(40.dp)) {
            Icon(
                imageVector = Icons.Filled.Notifications,
                contentDescription = "Notificaciones",
                tint = LucianosInk2,
                modifier = Modifier
                    .size(26.dp)
                    .align(Alignment.Center)
            )
            Box(
                modifier = Modifier
                    .size(8.dp)
                    .clip(CircleShape)
                    .background(LucianosWarn)
                    .align(Alignment.TopEnd)
            )
        }

        Spacer(modifier = Modifier.width(8.dp))

        AvatarCircle(initials = "LA", size = 36.dp)
    }
}

@Composable
private fun KpiHeroContent(navController: NavController) {
    val kpi = sampleKpi

    SectionEyebrow(
        text = "Ingresos de hoy",
        color = Color.White.copy(alpha = 0.6f)
    )

    Spacer(modifier = Modifier.height(6.dp))

    Row(verticalAlignment = Alignment.Bottom) {
        Text(
            text = kpi.incomeToday,
            style = MonoAmount,
            color = Color.White
        )
        Spacer(modifier = Modifier.width(10.dp))
        Box(
            modifier = Modifier
                .clip(RoundedCornerShape(6.dp))
                .background(LucianosPrimary.copy(alpha = 0.35f))
                .padding(horizontal = 8.dp, vertical = 3.dp)
        ) {
            Text(
                text = kpi.incomeChange,
                color = Color(0xFF7FD9A8),
                fontSize = 12.sp,
                fontWeight = FontWeight.SemiBold,
                fontFamily = FontFamily.SansSerif
            )
        }
    }

    Spacer(modifier = Modifier.height(20.dp))

    // Divider
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .height(1.dp)
            .background(Color.White.copy(alpha = 0.12f))
    )

    Spacer(modifier = Modifier.height(16.dp))

    // 3 mini stats
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        MiniStat(
            label = "Rentados",
            value = "${kpi.rented}/${kpi.total}",
            color = LucianosPrimary
        )
        MiniStatDivider()
        MiniStat(
            label = "Entregas hoy",
            value = "${kpi.deliveries}",
            color = Color.White
        )
        MiniStatDivider()
        MiniStat(
            label = "En taller",
            value = "${kpi.inWorkshop}",
            color = LucianosWarn
        )
    }
}

@Composable
private fun MiniStat(label: String, value: String, color: Color) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(
            text = value,
            fontSize = 22.sp,
            fontFamily = FontFamily.Monospace,
            fontWeight = FontWeight.Bold,
            color = color
        )
        Text(
            text = label,
            fontSize = 11.sp,
            color = Color.White.copy(alpha = 0.6f),
            fontFamily = FontFamily.SansSerif
        )
    }
}

@Composable
private fun MiniStatDivider() {
    Box(
        modifier = Modifier
            .width(1.dp)
            .height(36.dp)
            .background(Color.White.copy(alpha = 0.1f))
    )
}

@Composable
private fun AgendaSection(navController: NavController) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        color = Color.White,
        shadowElevation = 0.dp,
        border = androidx.compose.foundation.BorderStroke(1.dp, LucianosHairline)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Agenda de hoy",
                    fontSize = 16.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = LucianosInk,
                    fontFamily = FontFamily.SansSerif
                )
                TextButton(onClick = { navController.navigate(Screen.Reservations.route) }) {
                    Text(
                        text = "Ver todo",
                        color = LucianosPrimary,
                        fontSize = 13.sp,
                        fontFamily = FontFamily.SansSerif
                    )
                }
            }

            todayReservations.forEachIndexed { index, reservation ->
                TimelineItem(
                    time = reservation.time,
                    clientName = reservation.clientName,
                    vehicle = reservation.vehicle,
                    type = reservation.type,
                    initials = reservation.clientInitials,
                    isUrgent = reservation.status == "urgent"
                )
                if (index < todayReservations.size - 1) {
                    Divider(color = LucianosHairline, thickness = 1.dp)
                }
            }
        }
    }
}

@Composable
private fun AlertCard() {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(14.dp),
        color = LucianosWarnSoft,
        border = androidx.compose.foundation.BorderStroke(1.dp, LucianosWarn.copy(alpha = 0.3f))
    ) {
        Row(
            modifier = Modifier.padding(14.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(40.dp)
                    .clip(RoundedCornerShape(10.dp))
                    .background(LucianosWarn.copy(alpha = 0.15f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = Icons.Filled.Build,
                    contentDescription = null,
                    tint = LucianosWarn,
                    modifier = Modifier.size(20.dp)
                )
            }
            Spacer(modifier = Modifier.width(12.dp))
            Column {
                Text(
                    text = "Mantenimiento pendiente",
                    fontSize = 13.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = LucianosInk,
                    fontFamily = FontFamily.SansSerif
                )
                Text(
                    text = "Kia Rio · cambio de aceite vencido",
                    fontSize = 12.sp,
                    color = LucianosInk2,
                    fontFamily = FontFamily.SansSerif
                )
            }
        }
    }
}
