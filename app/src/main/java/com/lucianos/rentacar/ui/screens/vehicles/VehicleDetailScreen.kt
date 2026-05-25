package com.lucianos.rentacar.ui.screens.vehicles

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
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Assignment
import androidx.compose.material.icons.filled.Build
import androidx.compose.material.icons.filled.CalendarMonth
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material.icons.filled.History
import androidx.compose.material.icons.filled.MoreVert
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Divider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.lucianos.rentacar.data.Vehicle
import com.lucianos.rentacar.data.sampleFleet
import com.lucianos.rentacar.ui.components.SectionEyebrow
import com.lucianos.rentacar.ui.components.StatusChip
import com.lucianos.rentacar.ui.theme.LucianosBackground
import com.lucianos.rentacar.ui.theme.LucianosHairline
import com.lucianos.rentacar.ui.theme.LucianosInk
import com.lucianos.rentacar.ui.theme.LucianosInk2
import com.lucianos.rentacar.ui.theme.LucianosInk3
import com.lucianos.rentacar.ui.theme.LucianosPrimary
import com.lucianos.rentacar.ui.theme.LucianosPrimarySoft
import com.lucianos.rentacar.ui.theme.MonoPlate
import com.lucianos.rentacar.ui.theme.SerifHero

@Composable
fun VehicleDetailScreen(plate: String, onBack: () -> Unit) {
    val vehicle = sampleFleet.find { it.plate == plate }
        ?: sampleFleet.first()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(LucianosBackground)
    ) {
        // AppBar
        VehicleDetailAppBar(vehicle = vehicle, onBack = onBack)

        // Scrollable content
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
        ) {
            // Dark hero card
            VehicleHeroCard(vehicle = vehicle)

            Spacer(modifier = Modifier.height(16.dp))

            // Section rows
            VehicleSections(vehicle = vehicle)

            Spacer(modifier = Modifier.height(24.dp))

            // Primary action button
            Button(
                onClick = { /* register return */ },
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp)
                    .height(52.dp),
                shape = RoundedCornerShape(14.dp),
                colors = ButtonDefaults.buttonColors(containerColor = LucianosPrimary),
                enabled = vehicle.status == "rentado"
            ) {
                Text(
                    text = if (vehicle.status == "rentado") "Registrar devolución" else "No disponible",
                    fontWeight = FontWeight.SemiBold,
                    fontSize = 16.sp,
                    fontFamily = FontFamily.SansSerif
                )
            }

            Spacer(modifier = Modifier.height(32.dp))
        }
    }
}

@Composable
private fun VehicleDetailAppBar(vehicle: Vehicle, onBack: () -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(Color.White)
            .statusBarsPadding()
            .padding(horizontal = 4.dp, vertical = 4.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        IconButton(onClick = onBack) {
            Icon(Icons.Filled.ArrowBack, contentDescription = "Atrás", tint = LucianosInk)
        }
        Text(
            text = vehicle.model,
            fontSize = 17.sp,
            fontWeight = FontWeight.SemiBold,
            fontFamily = FontFamily.SansSerif,
            color = LucianosInk,
            modifier = Modifier.weight(1f)
        )
        IconButton(onClick = {}) {
            Icon(Icons.Filled.MoreVert, contentDescription = "Opciones", tint = LucianosInk2)
        }
    }
}

@Composable
private fun VehicleHeroCard(vehicle: Vehicle) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .background(Color(0xFF1E1E26))
            .padding(20.dp)
    ) {
        Column {
            // Car silhouette placeholder
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(100.dp),
                contentAlignment = Alignment.Center
            ) {
                // Simple stylized car representation
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Icon(
                        imageVector = Icons.Filled.Assignment,
                        contentDescription = null,
                        tint = Color.White.copy(alpha = 0.1f),
                        modifier = Modifier.size(72.dp)
                    )
                }
                // Car shape
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Box(
                        modifier = Modifier
                            .width(180.dp)
                            .height(40.dp)
                            .clip(RoundedCornerShape(20.dp))
                            .background(Color.White.copy(alpha = 0.06f))
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Box(
                        modifier = Modifier
                            .width(220.dp)
                            .height(36.dp)
                            .clip(RoundedCornerShape(8.dp))
                            .background(Color.White.copy(alpha = 0.08f))
                    )
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Plate
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    text = vehicle.plate,
                    style = MonoPlate.copy(fontSize = 22.sp),
                    color = Color.White
                )
                Spacer(modifier = Modifier.width(12.dp))
                StatusChip(status = vehicle.status)
            }

            Spacer(modifier = Modifier.height(4.dp))

            Text(
                text = "${vehicle.model} · ${vehicle.year} · ${vehicle.color}",
                fontSize = 13.sp,
                color = Color.White.copy(alpha = 0.6f),
                fontFamily = FontFamily.SansSerif
            )

            Spacer(modifier = Modifier.height(20.dp))

            // Divider
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(1.dp)
                    .background(Color.White.copy(alpha = 0.1f))
            )

            Spacer(modifier = Modifier.height(16.dp))

            // Mini stats
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                HeroMiniStat(label = "Kilometraje", value = "${vehicle.km} km")
                HeroMiniStat(label = "Combustible", value = "3/4")
                HeroMiniStat(label = "Tarifa diaria", value = "\$680")
            }
        }
    }
}

@Composable
private fun HeroMiniStat(label: String, value: String) {
    Column {
        Text(
            text = value,
            fontSize = 16.sp,
            fontFamily = FontFamily.Monospace,
            fontWeight = FontWeight.Bold,
            color = Color.White
        )
        Text(
            text = label,
            fontSize = 11.sp,
            color = Color.White.copy(alpha = 0.55f),
            fontFamily = FontFamily.SansSerif
        )
    }
}

@Composable
private fun VehicleSections(vehicle: Vehicle) {
    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp),
        shape = RoundedCornerShape(16.dp),
        color = Color.White,
        shadowElevation = 0.dp,
        border = androidx.compose.foundation.BorderStroke(1.dp, LucianosHairline)
    ) {
        Column {
            // Current rental
            if (vehicle.status == "rentado" && vehicle.currentClient != null) {
                SectionRow(
                    icon = Icons.Filled.Person,
                    title = "Renta actual",
                    subtitle = "${vehicle.currentClient} · ${vehicle.clientInfo ?: ""}",
                    iconColor = LucianosPrimary
                )
                Divider(color = LucianosHairline, thickness = 1.dp, modifier = Modifier.padding(start = 56.dp))
            }

            // Upcoming reservations
            SectionRow(
                icon = Icons.Filled.CalendarMonth,
                title = "Próximas reservas",
                subtitle = "2 reservas programadas",
                iconColor = Color(0xFF4444AA)
            )
            Divider(color = LucianosHairline, thickness = 1.dp, modifier = Modifier.padding(start = 56.dp))

            // Maintenance
            SectionRow(
                icon = Icons.Filled.Build,
                title = "Mantenimiento",
                subtitle = "Último servicio: hace 3 meses",
                iconColor = com.lucianos.rentacar.ui.theme.LucianosWarn
            )
            Divider(color = LucianosHairline, thickness = 1.dp, modifier = Modifier.padding(start = 56.dp))

            // History
            SectionRow(
                icon = Icons.Filled.History,
                title = "Historial de rentas",
                subtitle = "18 rentas completadas",
                iconColor = LucianosInk3
            )
        }
    }
}

@Composable
private fun SectionRow(
    icon: ImageVector,
    title: String,
    subtitle: String,
    iconColor: Color
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 14.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .size(40.dp)
                .clip(RoundedCornerShape(10.dp))
                .background(iconColor.copy(alpha = 0.1f)),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = iconColor,
                modifier = Modifier.size(20.dp)
            )
        }
        Spacer(modifier = Modifier.width(12.dp))
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = title,
                fontSize = 14.sp,
                fontWeight = FontWeight.SemiBold,
                color = LucianosInk,
                fontFamily = FontFamily.SansSerif
            )
            Text(
                text = subtitle,
                fontSize = 12.sp,
                color = LucianosInk3,
                fontFamily = FontFamily.SansSerif
            )
        }
        Icon(
            imageVector = Icons.Filled.ChevronRight,
            contentDescription = null,
            tint = LucianosInk3,
            modifier = Modifier.size(20.dp)
        )
    }
}
