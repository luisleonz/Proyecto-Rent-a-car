package com.lucianos.rentacar.ui.screens.more

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
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
import androidx.compose.material.icons.filled.BarChart
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material.icons.filled.Group
import androidx.compose.material.icons.filled.Headset
import androidx.compose.material.icons.filled.Logout
import androidx.compose.material.icons.filled.Payments
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.Divider
import androidx.compose.material3.Icon
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
import androidx.navigation.NavController
import com.lucianos.rentacar.ui.components.AvatarCircle
import com.lucianos.rentacar.ui.theme.LucianosBackground
import com.lucianos.rentacar.ui.theme.LucianosHairline
import com.lucianos.rentacar.ui.theme.LucianosInk
import com.lucianos.rentacar.ui.theme.LucianosInk2
import com.lucianos.rentacar.ui.theme.LucianosInk3
import com.lucianos.rentacar.ui.theme.LucianosPrimary
import com.lucianos.rentacar.ui.theme.LucianosPrimarySoft
import com.lucianos.rentacar.ui.theme.LucianosDanger
import com.lucianos.rentacar.ui.theme.LucianosDangerSoft

data class MoreMenuItem(
    val icon: ImageVector,
    val label: String,
    val sublabel: String? = null,
    val isDanger: Boolean = false,
    val iconTint: Color = LucianosInk2
)

@Composable
fun MoreScreen(navController: NavController) {
    val menuItems = listOf(
        MoreMenuItem(Icons.Filled.Payments, "Caja / Turno", "Cierre del día", iconTint = LucianosPrimary),
        MoreMenuItem(Icons.Filled.Group, "Equipo", "4 empleados activos", iconTint = Color(0xFF4444AA)),
        MoreMenuItem(Icons.Filled.BarChart, "Reportes", "Semana actual", iconTint = Color(0xFF888800)),
        MoreMenuItem(Icons.Filled.Settings, "Configuración", iconTint = LucianosInk2),
        MoreMenuItem(Icons.Filled.Headset, "Soporte", iconTint = LucianosInk2),
        MoreMenuItem(Icons.Filled.Logout, "Cerrar sesión", isDanger = true, iconTint = LucianosDanger),
    )

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(LucianosBackground)
    ) {
        // AppBar header area
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .background(Color.White)
                .statusBarsPadding()
                .padding(horizontal = 16.dp, vertical = 12.dp)
        ) {
            Text(
                text = "Más",
                fontSize = 22.sp,
                fontWeight = FontWeight.Bold,
                fontFamily = FontFamily.Serif,
                color = LucianosInk
            )
        }

        // Scrollable content
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 16.dp)
        ) {
            Spacer(modifier = Modifier.height(20.dp))

            // User profile header
            ProfileHeader()

            Spacer(modifier = Modifier.height(24.dp))

            // Main menu items (all but logout)
            Surface(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                color = Color.White,
                shadowElevation = 0.dp,
                border = androidx.compose.foundation.BorderStroke(1.dp, LucianosHairline)
            ) {
                Column {
                    menuItems.dropLast(1).forEachIndexed { index, item ->
                        MenuRow(item = item)
                        if (index < menuItems.size - 2) {
                            Divider(
                                color = LucianosHairline,
                                thickness = 1.dp,
                                modifier = Modifier.padding(start = 56.dp)
                            )
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Logout item (separate card)
            Surface(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                color = LucianosDangerSoft,
                shadowElevation = 0.dp,
                border = androidx.compose.foundation.BorderStroke(1.dp, LucianosDanger.copy(alpha = 0.2f))
            ) {
                MenuRow(item = menuItems.last())
            }

            Spacer(modifier = Modifier.height(16.dp))

            // App version
            Text(
                text = "Lucianos Rent-a-Car v1.0",
                fontSize = 11.sp,
                color = LucianosInk3,
                fontFamily = FontFamily.SansSerif,
                modifier = Modifier.align(Alignment.CenterHorizontally)
            )

            Spacer(modifier = Modifier.height(24.dp))
        }
    }
}

@Composable
private fun ProfileHeader() {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        color = Color.White,
        shadowElevation = 0.dp,
        border = androidx.compose.foundation.BorderStroke(1.dp, LucianosHairline)
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            AvatarCircle(
                initials = "LA",
                accent = LucianosPrimary,
                size = 52.dp
            )
            Spacer(modifier = Modifier.width(14.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = "Luciano",
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold,
                    fontFamily = FontFamily.Serif,
                    color = LucianosInk
                )
                Text(
                    text = "Administrador · Polanco",
                    fontSize = 13.sp,
                    color = LucianosInk3,
                    fontFamily = FontFamily.SansSerif
                )
                Spacer(modifier = Modifier.height(6.dp))
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(20.dp))
                        .background(LucianosPrimarySoft)
                        .padding(horizontal = 8.dp, vertical = 3.dp)
                ) {
                    Text(
                        text = "Admin",
                        fontSize = 11.sp,
                        color = LucianosPrimary,
                        fontWeight = FontWeight.SemiBold,
                        fontFamily = FontFamily.SansSerif
                    )
                }
            }
        }
    }
}

@Composable
private fun MenuRow(item: MoreMenuItem) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { /* navigate */ }
            .padding(horizontal = 16.dp, vertical = 14.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .size(36.dp)
                .clip(RoundedCornerShape(10.dp))
                .background(item.iconTint.copy(alpha = 0.1f)),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = item.icon,
                contentDescription = null,
                tint = item.iconTint,
                modifier = Modifier.size(20.dp)
            )
        }

        Spacer(modifier = Modifier.width(12.dp))

        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = item.label,
                fontSize = 15.sp,
                fontWeight = FontWeight.Medium,
                color = if (item.isDanger) LucianosDanger else LucianosInk,
                fontFamily = FontFamily.SansSerif
            )
            if (item.sublabel != null) {
                Text(
                    text = item.sublabel,
                    fontSize = 12.sp,
                    color = LucianosInk3,
                    fontFamily = FontFamily.SansSerif
                )
            }
        }

        if (!item.isDanger) {
            Icon(
                imageVector = Icons.Filled.ChevronRight,
                contentDescription = null,
                tint = LucianosInk3,
                modifier = Modifier.size(20.dp)
            )
        }
    }
}
