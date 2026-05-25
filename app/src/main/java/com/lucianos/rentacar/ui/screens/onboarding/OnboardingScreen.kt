package com.lucianos.rentacar.ui.screens.onboarding

import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.CalendarMonth
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.DirectionsCar
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material.icons.filled.VisibilityOff
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Divider
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.lucianos.rentacar.ui.components.AvatarCircle
import com.lucianos.rentacar.ui.components.SectionEyebrow
import com.lucianos.rentacar.ui.theme.LucianosDanger
import com.lucianos.rentacar.ui.theme.LucianosDangerSoft
import com.lucianos.rentacar.ui.theme.LucianosHairline
import com.lucianos.rentacar.ui.theme.LucianosInk
import com.lucianos.rentacar.ui.theme.LucianosInk2
import com.lucianos.rentacar.ui.theme.LucianosInk3
import com.lucianos.rentacar.ui.theme.LucianosPrimary
import com.lucianos.rentacar.ui.theme.LucianosPrimaryDeep
import com.lucianos.rentacar.ui.theme.LucianosPrimarySoft
import com.lucianos.rentacar.ui.theme.LucianosWarn
import com.lucianos.rentacar.ui.theme.LucianosWarnSoft
import com.lucianos.rentacar.ui.theme.SerifHero

// ─── Screen 1: Welcome ───────────────────────────────────────────────────────

@Composable
fun OnboardingWelcomeScreen(onContinue: () -> Unit) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(LucianosPrimaryDeep)
            .statusBarsPadding()
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(24.dp),
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            Column {
                Spacer(modifier = Modifier.height(24.dp))
                // Logo area
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .size(48.dp)
                            .clip(RoundedCornerShape(12.dp))
                            .background(LucianosPrimary),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Filled.DirectionsCar,
                            contentDescription = null,
                            tint = Color.White,
                            modifier = Modifier.size(28.dp)
                        )
                    }
                    Spacer(modifier = Modifier.width(12.dp))
                    Text(
                        text = "Lucianos",
                        color = Color.White,
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Bold,
                        fontFamily = FontFamily.Serif
                    )
                }

                Spacer(modifier = Modifier.height(40.dp))

                Text(
                    text = "Hola Esteban,\nvamos a configurar\ntu acceso.",
                    style = SerifHero,
                    color = Color.White,
                    lineHeight = 52.sp
                )

                Spacer(modifier = Modifier.height(32.dp))

                // Setup steps list
                val steps = listOf(
                    "Crear tu contraseña",
                    "Revisar tus permisos",
                    "Conocer la app",
                    "Listo para trabajar"
                )
                steps.forEachIndexed { index, step ->
                    Row(
                        modifier = Modifier.padding(vertical = 8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Box(
                            modifier = Modifier
                                .size(28.dp)
                                .clip(CircleShape)
                                .background(Color.White.copy(alpha = 0.15f)),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = "${index + 1}",
                                color = Color.White,
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Bold,
                                fontFamily = FontFamily.SansSerif
                            )
                        }
                        Spacer(modifier = Modifier.width(12.dp))
                        Text(
                            text = step,
                            color = Color.White.copy(alpha = 0.85f),
                            fontSize = 15.sp,
                            fontFamily = FontFamily.SansSerif
                        )
                    }
                }
            }

            // CTA Button
            Button(
                onClick = onContinue,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(52.dp),
                shape = RoundedCornerShape(14.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = Color.White,
                    contentColor = LucianosPrimaryDeep
                )
            ) {
                Text(
                    text = "Empezar configuración",
                    fontWeight = FontWeight.SemiBold,
                    fontSize = 16.sp,
                    fontFamily = FontFamily.SansSerif
                )
            }
        }
    }
}

// ─── Screen 2: Password ──────────────────────────────────────────────────────

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun OnboardingPasswordScreen(onContinue: () -> Unit, onBack: () -> Unit) {
    var password by remember { mutableStateOf("") }
    var confirmPassword by remember { mutableStateOf("") }
    var showPassword by remember { mutableStateOf(false) }
    var showConfirm by remember { mutableStateOf(false) }
    var twoFactorEnabled by remember { mutableStateOf(true) }

    val hasLength = password.length >= 8
    val hasUpper = password.any { it.isUpperCase() }
    val hasNumber = password.any { it.isDigit() }
    val hasMatch = password == confirmPassword && password.isNotEmpty()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.White)
            .statusBarsPadding()
            .verticalScroll(rememberScrollState())
    ) {
        // Top bar
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 8.dp, vertical = 4.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconButton(onClick = onBack) {
                Icon(Icons.Filled.ArrowBack, contentDescription = "Atrás", tint = LucianosInk)
            }
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = "Tu contraseña",
                    fontSize = 17.sp,
                    fontWeight = FontWeight.SemiBold,
                    fontFamily = FontFamily.SansSerif,
                    color = LucianosInk
                )
                Text(
                    text = "Paso 1 de 4",
                    fontSize = 12.sp,
                    color = LucianosInk3,
                    fontFamily = FontFamily.SansSerif
                )
            }
        }

        // Progress bar
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 20.dp),
            horizontalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            repeat(4) { index ->
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .height(4.dp)
                        .clip(RoundedCornerShape(2.dp))
                        .background(if (index == 0) LucianosPrimary else LucianosHairline)
                )
            }
        }

        Spacer(modifier = Modifier.height(28.dp))

        Column(modifier = Modifier.padding(horizontal = 20.dp)) {
            Text(
                text = "Crea tu contraseña",
                fontSize = 24.sp,
                fontWeight = FontWeight.Bold,
                fontFamily = FontFamily.Serif,
                color = LucianosInk
            )
            Spacer(modifier = Modifier.height(6.dp))
            Text(
                text = "Será la que usarás para entrar a Lucianos cada vez.",
                fontSize = 14.sp,
                color = LucianosInk2,
                fontFamily = FontFamily.SansSerif
            )

            Spacer(modifier = Modifier.height(24.dp))

            OutlinedTextField(
                value = password,
                onValueChange = { password = it },
                label = { Text("Nueva contraseña") },
                modifier = Modifier.fillMaxWidth(),
                visualTransformation = if (showPassword) VisualTransformation.None else PasswordVisualTransformation(),
                trailingIcon = {
                    IconButton(onClick = { showPassword = !showPassword }) {
                        Icon(
                            if (showPassword) Icons.Filled.VisibilityOff else Icons.Filled.Visibility,
                            contentDescription = null,
                            tint = LucianosInk3
                        )
                    }
                },
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = LucianosPrimary,
                    focusedLabelColor = LucianosPrimary,
                )
            )

            Spacer(modifier = Modifier.height(12.dp))

            OutlinedTextField(
                value = confirmPassword,
                onValueChange = { confirmPassword = it },
                label = { Text("Confirmar contraseña") },
                modifier = Modifier.fillMaxWidth(),
                visualTransformation = if (showConfirm) VisualTransformation.None else PasswordVisualTransformation(),
                trailingIcon = {
                    IconButton(onClick = { showConfirm = !showConfirm }) {
                        Icon(
                            if (showConfirm) Icons.Filled.VisibilityOff else Icons.Filled.Visibility,
                            contentDescription = null,
                            tint = LucianosInk3
                        )
                    }
                },
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = LucianosPrimary,
                    focusedLabelColor = LucianosPrimary,
                )
            )

            Spacer(modifier = Modifier.height(20.dp))

            // Requirements card
            Surface(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(14.dp),
                color = LucianosPrimarySoft,
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = "Requisitos",
                        fontSize = 13.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = LucianosPrimaryDeep,
                        fontFamily = FontFamily.SansSerif
                    )
                    Spacer(modifier = Modifier.height(10.dp))
                    RequirementRow("Mínimo 8 caracteres", hasLength)
                    RequirementRow("Al menos una mayúscula", hasUpper)
                    RequirementRow("Al menos un número", hasNumber)
                    RequirementRow("Las contraseñas coinciden", hasMatch)
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // 2FA toggle card
            Surface(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(14.dp),
                color = Color.White,
                shadowElevation = 0.dp,
                border = androidx.compose.foundation.BorderStroke(1.dp, LucianosHairline)
            ) {
                Row(
                    modifier = Modifier.padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = "Verificación en 2 pasos",
                            fontSize = 14.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = LucianosInk,
                            fontFamily = FontFamily.SansSerif
                        )
                        Text(
                            text = "Recomendado para mayor seguridad",
                            fontSize = 12.sp,
                            color = LucianosInk3,
                            fontFamily = FontFamily.SansSerif
                        )
                    }
                    Switch(
                        checked = twoFactorEnabled,
                        onCheckedChange = { twoFactorEnabled = it },
                        colors = SwitchDefaults.colors(
                            checkedThumbColor = Color.White,
                            checkedTrackColor = LucianosPrimary
                        )
                    )
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Warning banner
            Surface(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                color = LucianosWarnSoft,
            ) {
                Row(
                    modifier = Modifier.padding(12.dp),
                    verticalAlignment = Alignment.Top
                ) {
                    Icon(
                        Icons.Filled.Info,
                        contentDescription = null,
                        tint = LucianosWarn,
                        modifier = Modifier.size(18.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "Esta contraseña es personal. No la compartas con nadie, ni con el administrador.",
                        fontSize = 12.sp,
                        color = LucianosInk2,
                        fontFamily = FontFamily.SansSerif,
                        lineHeight = 18.sp
                    )
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            Button(
                onClick = onContinue,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(52.dp),
                shape = RoundedCornerShape(14.dp),
                colors = ButtonDefaults.buttonColors(containerColor = LucianosPrimary)
            ) {
                Text(
                    text = "Continuar",
                    fontWeight = FontWeight.SemiBold,
                    fontSize = 16.sp,
                    fontFamily = FontFamily.SansSerif
                )
            }

            Spacer(modifier = Modifier.height(24.dp))
        }
    }
}

@Composable
private fun RequirementRow(text: String, met: Boolean) {
    Row(
        modifier = Modifier.padding(vertical = 4.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(
            imageVector = Icons.Filled.Check,
            contentDescription = null,
            tint = if (met) LucianosPrimary else LucianosInk4,
            modifier = Modifier.size(16.dp)
        )
        Spacer(modifier = Modifier.width(8.dp))
        Text(
            text = text,
            fontSize = 13.sp,
            color = if (met) LucianosPrimary else LucianosInk3,
            fontFamily = FontFamily.SansSerif
        )
    }
}

// ─── Screen 3: Permissions ───────────────────────────────────────────────────

@Composable
fun OnboardingPermissionsScreen(onContinue: () -> Unit, onBack: () -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.White)
            .statusBarsPadding()
            .verticalScroll(rememberScrollState())
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 8.dp, vertical = 4.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconButton(onClick = onBack) {
                Icon(Icons.Filled.ArrowBack, contentDescription = "Atrás", tint = LucianosInk)
            }
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = "Tus permisos",
                    fontSize = 17.sp,
                    fontWeight = FontWeight.SemiBold,
                    fontFamily = FontFamily.SansSerif,
                    color = LucianosInk
                )
                Text(
                    text = "Paso 2 de 4",
                    fontSize = 12.sp,
                    color = LucianosInk3,
                    fontFamily = FontFamily.SansSerif
                )
            }
        }

        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 20.dp),
            horizontalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            repeat(4) { index ->
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .height(4.dp)
                        .clip(RoundedCornerShape(2.dp))
                        .background(if (index <= 1) LucianosPrimary else LucianosHairline)
                )
            }
        }

        Spacer(modifier = Modifier.height(28.dp))

        Column(modifier = Modifier.padding(horizontal = 20.dp)) {
            Text(
                text = "Lo que puedes hacer",
                fontSize = 24.sp,
                fontWeight = FontWeight.Bold,
                fontFamily = FontFamily.Serif,
                color = LucianosInk
            )
            Spacer(modifier = Modifier.height(6.dp))
            Text(
                text = "Como empleado de mostrador, estos son tus accesos.",
                fontSize = 14.sp,
                color = LucianosInk2,
                fontFamily = FontFamily.SansSerif
            )

            Spacer(modifier = Modifier.height(24.dp))

            // Allowed permissions card
            Surface(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                color = LucianosPrimarySoft,
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = "Permitido",
                        fontSize = 13.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = LucianosPrimaryDeep,
                        fontFamily = FontFamily.SansSerif
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    val allowed = listOf(
                        "Ver y gestionar reservas del día",
                        "Registrar entregas y devoluciones",
                        "Consultar estado de vehículos",
                        "Procesar pagos en efectivo",
                        "Ver perfil de clientes"
                    )
                    allowed.forEach { item ->
                        PermissionRow(text = item, allowed = true)
                    }
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Not allowed card
            Surface(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                color = LucianosDangerSoft,
                border = androidx.compose.foundation.BorderStroke(1.dp, LucianosDanger.copy(alpha = 0.3f))
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = "No disponible para tu rol",
                        fontSize = 13.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = LucianosDanger,
                        fontFamily = FontFamily.SansSerif
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    val notAllowed = listOf(
                        "Modificar tarifas o precios",
                        "Agregar o eliminar vehículos",
                        "Ver reportes financieros",
                        "Gestionar cuentas de empleados"
                    )
                    notAllowed.forEach { item ->
                        PermissionRow(text = item, allowed = false)
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Info banner
            Surface(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                color = Color(0xFFEEF2FF),
            ) {
                Row(
                    modifier = Modifier.padding(12.dp),
                    verticalAlignment = Alignment.Top
                ) {
                    Icon(
                        Icons.Filled.Info,
                        contentDescription = null,
                        tint = Color(0xFF4444AA),
                        modifier = Modifier.size(18.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "Si necesitas acceso adicional, contacta al administrador de tu sucursal.",
                        fontSize = 12.sp,
                        color = LucianosInk2,
                        fontFamily = FontFamily.SansSerif,
                        lineHeight = 18.sp
                    )
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            Button(
                onClick = onContinue,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(52.dp),
                shape = RoundedCornerShape(14.dp),
                colors = ButtonDefaults.buttonColors(containerColor = LucianosPrimary)
            ) {
                Text(
                    text = "Entendido, continuar",
                    fontWeight = FontWeight.SemiBold,
                    fontSize = 16.sp,
                    fontFamily = FontFamily.SansSerif
                )
            }

            Spacer(modifier = Modifier.height(24.dp))
        }
    }
}

@Composable
private fun PermissionRow(text: String, allowed: Boolean) {
    Row(
        modifier = Modifier.padding(vertical = 5.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(
            imageVector = if (allowed) Icons.Filled.Check else Icons.Filled.Close,
            contentDescription = null,
            tint = if (allowed) LucianosPrimary else LucianosDanger,
            modifier = Modifier.size(16.dp)
        )
        Spacer(modifier = Modifier.width(8.dp))
        Text(
            text = text,
            fontSize = 13.sp,
            color = LucianosInk2,
            fontFamily = FontFamily.SansSerif
        )
    }
}

// ─── Screen 4: Tour ──────────────────────────────────────────────────────────

@Composable
fun OnboardingTourScreen(onContinue: () -> Unit, onSkip: () -> Unit, onBack: () -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.White)
            .statusBarsPadding()
            .verticalScroll(rememberScrollState())
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 8.dp, vertical = 4.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconButton(onClick = onBack) {
                Icon(Icons.Filled.ArrowBack, contentDescription = "Atrás", tint = LucianosInk)
            }
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = "Tour rápido",
                    fontSize = 17.sp,
                    fontWeight = FontWeight.SemiBold,
                    fontFamily = FontFamily.SansSerif,
                    color = LucianosInk
                )
                Text(
                    text = "Paso 3 de 4",
                    fontSize = 12.sp,
                    color = LucianosInk3,
                    fontFamily = FontFamily.SansSerif
                )
            }
        }

        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 20.dp),
            horizontalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            repeat(4) { index ->
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .height(4.dp)
                        .clip(RoundedCornerShape(2.dp))
                        .background(if (index <= 2) LucianosPrimary else LucianosHairline)
                )
            }
        }

        Spacer(modifier = Modifier.height(28.dp))

        Column(modifier = Modifier.padding(horizontal = 20.dp)) {
            Text(
                text = "3 pantallas que verás\ntodos los días",
                fontSize = 24.sp,
                fontWeight = FontWeight.Bold,
                fontFamily = FontFamily.Serif,
                color = LucianosInk,
                lineHeight = 32.sp
            )

            Spacer(modifier = Modifier.height(24.dp))

            // Tour cards
            val tourItems = listOf(
                Triple(Icons.Filled.Home, "Panel del día", "Ve los ingresos, movimientos y alertas del turno en un vistazo."),
                Triple(Icons.Filled.CalendarMonth, "Reservas", "Consulta y gestiona todas las entregas y devoluciones programadas."),
                Triple(Icons.Filled.DirectionsCar, "Autos disponibles", "Estado en tiempo real de toda la flotilla: disponibles, rentados y en taller."),
            )

            tourItems.forEach { (icon, title, desc) ->
                Surface(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 6.dp),
                    shape = RoundedCornerShape(16.dp),
                    color = Color.White,
                    shadowElevation = 0.dp,
                    border = androidx.compose.foundation.BorderStroke(1.dp, LucianosHairline)
                ) {
                    Row(
                        modifier = Modifier.padding(16.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Box(
                            modifier = Modifier
                                .size(44.dp)
                                .clip(RoundedCornerShape(12.dp))
                                .background(LucianosPrimarySoft),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = icon,
                                contentDescription = null,
                                tint = LucianosPrimary,
                                modifier = Modifier.size(24.dp)
                            )
                        }
                        Spacer(modifier = Modifier.width(14.dp))
                        Column {
                            Text(
                                text = title,
                                fontSize = 15.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = LucianosInk,
                                fontFamily = FontFamily.SansSerif
                            )
                            Spacer(modifier = Modifier.height(2.dp))
                            Text(
                                text = desc,
                                fontSize = 12.sp,
                                color = LucianosInk2,
                                fontFamily = FontFamily.SansSerif,
                                lineHeight = 17.sp
                            )
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Dark tip card
            Surface(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                color = Color(0xFF1E1E26)
            ) {
                Row(
                    modifier = Modifier.padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        Icons.Filled.Star,
                        contentDescription = null,
                        tint = Color(0xFFFFD700),
                        modifier = Modifier.size(20.dp)
                    )
                    Spacer(modifier = Modifier.width(12.dp))
                    Text(
                        text = "Tip: Toca cualquier reserva para ver los detalles completos del cliente y el vehículo.",
                        fontSize = 13.sp,
                        color = Color.White.copy(alpha = 0.85f),
                        fontFamily = FontFamily.SansSerif,
                        lineHeight = 19.sp,
                        modifier = Modifier.weight(1f)
                    )
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            Button(
                onClick = onContinue,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(52.dp),
                shape = RoundedCornerShape(14.dp),
                colors = ButtonDefaults.buttonColors(containerColor = LucianosPrimary)
            ) {
                Text(
                    text = "Continuar",
                    fontWeight = FontWeight.SemiBold,
                    fontSize = 16.sp,
                    fontFamily = FontFamily.SansSerif
                )
            }

            Spacer(modifier = Modifier.height(12.dp))

            TextButton(
                onClick = onSkip,
                modifier = Modifier.fillMaxWidth()
            ) {
                Text(
                    text = "Saltar tour",
                    color = LucianosInk3,
                    fontSize = 14.sp,
                    fontFamily = FontFamily.SansSerif
                )
            }

            Spacer(modifier = Modifier.height(24.dp))
        }
    }
}

// ─── Screen 5: Done ──────────────────────────────────────────────────────────

@Composable
fun OnboardingDoneScreen(onEnterPanel: () -> Unit) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(LucianosPrimary)
            .statusBarsPadding()
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(24.dp),
            verticalArrangement = Arrangement.SpaceBetween,
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Spacer(modifier = Modifier.height(32.dp))

            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                // Success icon
                Box(
                    modifier = Modifier
                        .size(88.dp)
                        .clip(CircleShape)
                        .background(Color.White.copy(alpha = 0.2f)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Filled.CheckCircle,
                        contentDescription = null,
                        tint = Color.White,
                        modifier = Modifier.size(52.dp)
                    )
                }

                Spacer(modifier = Modifier.height(28.dp))

                Text(
                    text = "Bienvenido al\nequipo, Esteban.",
                    style = SerifHero.copy(fontSize = 36.sp),
                    color = Color.White,
                    textAlign = TextAlign.Center,
                    lineHeight = 44.sp
                )

                Spacer(modifier = Modifier.height(12.dp))

                Text(
                    text = "Tu cuenta está configurada y lista.",
                    fontSize = 15.sp,
                    color = Color.White.copy(alpha = 0.8f),
                    fontFamily = FontFamily.SansSerif,
                    textAlign = TextAlign.Center
                )

                Spacer(modifier = Modifier.height(32.dp))

                // Setup summary card
                Surface(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(18.dp),
                    color = Color.White.copy(alpha = 0.15f)
                ) {
                    Column(modifier = Modifier.padding(20.dp)) {
                        SummaryRow("Rol", "Empleado de mostrador")
                        Divider(
                            color = Color.White.copy(alpha = 0.2f),
                            modifier = Modifier.padding(vertical = 10.dp)
                        )
                        SummaryRow("Sucursal", "Polanco")
                        Divider(
                            color = Color.White.copy(alpha = 0.2f),
                            modifier = Modifier.padding(vertical = 10.dp)
                        )
                        SummaryRow("ID empleado", "EMP-2024-047")
                        Divider(
                            color = Color.White.copy(alpha = 0.2f),
                            modifier = Modifier.padding(vertical = 10.dp)
                        )
                        SummaryRow("Acceso admin", "No")
                    }
                }
            }

            Column {
                Button(
                    onClick = onEnterPanel,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(54.dp),
                    shape = RoundedCornerShape(14.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = Color.White,
                        contentColor = LucianosPrimary
                    )
                ) {
                    Text(
                        text = "Entrar al panel",
                        fontWeight = FontWeight.Bold,
                        fontSize = 17.sp,
                        fontFamily = FontFamily.SansSerif
                    )
                }

                Spacer(modifier = Modifier.height(20.dp))
            }
        }
    }
}

@Composable
private fun SummaryRow(label: String, value: String) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(
            text = label,
            fontSize = 13.sp,
            color = Color.White.copy(alpha = 0.7f),
            fontFamily = FontFamily.SansSerif
        )
        Text(
            text = value,
            fontSize = 13.sp,
            color = Color.White,
            fontWeight = FontWeight.SemiBold,
            fontFamily = FontFamily.SansSerif
        )
    }
}
