package com.lucianos.rentacar.ui.screens.vehicles

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
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
import androidx.compose.material.icons.filled.FilterList
import androidx.compose.material.icons.filled.Search
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
import com.lucianos.rentacar.data.Vehicle
import com.lucianos.rentacar.data.sampleFleet
import com.lucianos.rentacar.navigation.Screen
import com.lucianos.rentacar.ui.components.VehicleListItem
import com.lucianos.rentacar.ui.theme.LucianosBackground
import com.lucianos.rentacar.ui.theme.LucianosHairline
import com.lucianos.rentacar.ui.theme.LucianosInk
import com.lucianos.rentacar.ui.theme.LucianosInk2
import com.lucianos.rentacar.ui.theme.LucianosInk3
import com.lucianos.rentacar.ui.theme.LucianosInk4
import com.lucianos.rentacar.ui.theme.LucianosPrimary
import com.lucianos.rentacar.ui.theme.LucianosPrimarySoft
import com.lucianos.rentacar.ui.theme.LucianosWarn

@Composable
fun VehiclesScreen(navController: NavController) {
    val filters = listOf("Todos", "Disponibles", "Rentados", "Reservados", "Taller")
    var selectedFilter by remember { mutableStateOf("Todos") }

    val filtered = when (selectedFilter) {
        "Disponibles"  -> sampleFleet.filter { it.status == "disponible" }
        "Rentados"     -> sampleFleet.filter { it.status == "rentado" }
        "Reservados"   -> sampleFleet.filter { it.status == "reservado" }
        "Taller"       -> sampleFleet.filter { it.status == "taller" }
        else           -> sampleFleet
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(LucianosBackground)
    ) {
        Column(modifier = Modifier.fillMaxSize()) {
            // AppBar
            VehiclesAppBar()

            // Content
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .verticalScroll(rememberScrollState())
                    .padding(horizontal = 16.dp)
            ) {
                Spacer(modifier = Modifier.height(16.dp))

                // Occupancy bar card
                OccupancyCard()

                Spacer(modifier = Modifier.height(16.dp))

                // Segmented filter
                SegmentedFilter(
                    options = filters,
                    selected = selectedFilter,
                    onSelect = { selectedFilter = it }
                )

                Spacer(modifier = Modifier.height(16.dp))

                // Vehicle list
                if (filtered.isEmpty()) {
                    Column(
                        modifier = Modifier.fillMaxWidth().padding(vertical = 48.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Text("🚗", fontSize = 36.sp)
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = "Sin vehículos en esta categoría",
                            fontSize = 15.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = LucianosInk,
                            fontFamily = FontFamily.SansSerif
                        )
                        Text(
                            text = "Prueba con otro filtro.",
                            fontSize = 13.sp,
                            color = LucianosInk3,
                            fontFamily = FontFamily.SansSerif
                        )
                    }
                } else {
                    Surface(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(16.dp),
                        color = Color.White,
                        shadowElevation = 0.dp,
                        border = androidx.compose.foundation.BorderStroke(1.dp, LucianosHairline)
                    ) {
                        Column(modifier = Modifier.padding(horizontal = 16.dp)) {
                            filtered.forEachIndexed { index, vehicle ->
                                VehicleListItem(
                                    plate = vehicle.plate,
                                    model = vehicle.model,
                                    color = vehicle.color,
                                    km = vehicle.km,
                                    status = vehicle.status,
                                    clientInfo = buildClientInfo(vehicle),
                                    modifier = Modifier.clickable {
                                        navController.navigate(Screen.VehicleDetail.withPlate(vehicle.plate))
                                    }
                                )
                                if (index < filtered.size - 1) {
                                    Divider(color = LucianosHairline, thickness = 1.dp)
                                }
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(80.dp))
            }
        }

        // FAB
        FloatingActionButton(
            onClick = { /* add vehicle */ },
            modifier = Modifier
                .align(Alignment.BottomEnd)
                .padding(end = 16.dp, bottom = 16.dp),
            containerColor = LucianosPrimary,
            contentColor = Color.White,
            shape = CircleShape
        ) {
            Icon(Icons.Filled.Add, contentDescription = "Agregar vehículo")
        }
    }
}

private fun buildClientInfo(vehicle: Vehicle): String? {
    return when {
        vehicle.currentClient != null && vehicle.clientInfo != null ->
            "${vehicle.currentClient} · ${vehicle.clientInfo}"
        vehicle.currentClient != null -> vehicle.currentClient
        vehicle.clientInfo != null -> vehicle.clientInfo
        else -> null
    }
}

@Composable
private fun VehiclesAppBar() {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(Color.White)
            .statusBarsPadding()
            .padding(horizontal = 16.dp, vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text = "Vehículos",
            fontSize = 22.sp,
            fontWeight = FontWeight.Bold,
            fontFamily = FontFamily.Serif,
            color = LucianosInk,
            modifier = Modifier.weight(1f)
        )
        IconButton(onClick = {}) {
            Icon(
                imageVector = Icons.Filled.Search,
                contentDescription = "Buscar",
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
private fun OccupancyCard() {
    val rented = sampleFleet.count { it.status == "rentado" }
    val workshop = sampleFleet.count { it.status == "taller" }
    val reserved = sampleFleet.count { it.status == "reservado" }
    val available = sampleFleet.count { it.status == "disponible" }
    val total = sampleFleet.size.toFloat()

    val rentedFraction = rented / total
    val workshopFraction = workshop / total
    val reservedFraction = reserved / total

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
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    text = "Ocupación",
                    fontSize = 14.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = LucianosInk,
                    fontFamily = FontFamily.SansSerif
                )
                Text(
                    text = "${sampleFleet.size} vehículos",
                    fontSize = 12.sp,
                    color = LucianosInk3,
                    fontFamily = FontFamily.SansSerif
                )
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Segmented progress bar
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(10.dp)
                    .clip(RoundedCornerShape(5.dp))
            ) {
                if (rentedFraction > 0) {
                    Box(
                        modifier = Modifier
                            .weight(rentedFraction)
                            .height(10.dp)
                            .background(LucianosPrimary)
                    )
                }
                if (workshopFraction > 0) {
                    Box(
                        modifier = Modifier
                            .weight(workshopFraction)
                            .height(10.dp)
                            .background(LucianosWarn)
                    )
                }
                if (reservedFraction > 0) {
                    Box(
                        modifier = Modifier
                            .weight(reservedFraction)
                            .height(10.dp)
                            .background(Color(0xFF9999CC))
                    )
                }
                val remainingFraction = 1f - rentedFraction - workshopFraction - reservedFraction
                if (remainingFraction > 0) {
                    Box(
                        modifier = Modifier
                            .weight(remainingFraction)
                            .height(10.dp)
                            .background(LucianosInk4)
                    )
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Legend
            Row(
                horizontalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                LegendItem(color = LucianosPrimary, label = "Rentados $rented")
                LegendItem(color = LucianosWarn, label = "Taller $workshop")
                LegendItem(color = Color(0xFF9999CC), label = "Reservado $reserved")
                LegendItem(color = LucianosInk4, label = "Libre $available")
            }
        }
    }
}

@Composable
private fun LegendItem(color: Color, label: String) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        Box(
            modifier = Modifier
                .size(8.dp)
                .clip(CircleShape)
                .background(color)
        )
        Spacer(modifier = Modifier.width(4.dp))
        Text(
            text = label,
            fontSize = 11.sp,
            color = LucianosInk3,
            fontFamily = FontFamily.SansSerif
        )
    }
}

@Composable
private fun SegmentedFilter(
    options: List<String>,
    selected: String,
    onSelect: (String) -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .horizontalScroll(rememberScrollState()),
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        options.forEach { option ->
            val isSelected = selected == option
            Box(
                modifier = Modifier
                    .clip(RoundedCornerShape(20.dp))
                    .background(if (isSelected) LucianosPrimary else Color(0xFFF0F0F0))
                    .clickable { onSelect(option) }
                    .padding(horizontal = 16.dp, vertical = 8.dp),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = option,
                    fontSize = 13.sp,
                    fontWeight = if (isSelected) FontWeight.SemiBold else FontWeight.Normal,
                    color = if (isSelected) Color.White else LucianosInk3,
                    fontFamily = FontFamily.SansSerif
                )
            }
        }
    }
}
