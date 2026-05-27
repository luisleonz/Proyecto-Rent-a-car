package com.lucianos.rentacar.ui.screens.caja

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import com.lucianos.rentacar.data.AuthState
import com.lucianos.rentacar.data.TurnoState
import com.lucianos.rentacar.navigation.Screen
import com.lucianos.rentacar.ui.components.AvatarCircle
import com.lucianos.rentacar.ui.components.SectionEyebrow
import com.lucianos.rentacar.ui.theme.*

// ─── Hub: estado actual del turno ────────────────────────────────────────────

@Composable
fun CajaTurnoScreen(navController: NavController) {
    var turnoAbierto by remember { mutableStateOf(TurnoState.isOpen) }

    Column(modifier = Modifier.fillMaxSize().background(LucianosBackground)) {
        // AppBar
        Surface(color = Color.White, shadowElevation = 0.dp, modifier = Modifier.fillMaxWidth()) {
            Row(
                modifier = Modifier.fillMaxWidth().statusBarsPadding()
                    .padding(horizontal = 16.dp, vertical = 12.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(
                    modifier = Modifier.size(36.dp).clip(CircleShape).background(LucianosPaperAlt)
                        .border(1.dp, LucianosHairline, CircleShape)
                        .clickable { navController.popBackStack() },
                    contentAlignment = Alignment.Center
                ) {
                    Icon(Icons.Filled.ArrowBack, contentDescription = "Atrás",
                        tint = LucianosInk2, modifier = Modifier.size(18.dp))
                }
                Spacer(Modifier.width(12.dp))
                Column(Modifier.weight(1f)) {
                    Text("Caja / Turno", fontSize = 20.sp, fontWeight = FontWeight.Bold,
                        fontFamily = FontFamily.Serif, color = LucianosInk)
                    Text("Sucursal ${AuthState.currentBranch}", fontSize = 12.sp,
                        color = LucianosInk3, fontFamily = FontFamily.SansSerif)
                }
            }
        }

        Column(
            modifier = Modifier.fillMaxSize().verticalScroll(rememberScrollState())
                .padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            Spacer(Modifier.height(4.dp))

            // Tarjeta de turno actual (dark)
            Surface(
                modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(18.dp),
                color = LucianosDarkCard
            ) {
                Column(modifier = Modifier.padding(18.dp)) {
                    SectionEyebrow(text = "TURNO ${TurnoState.turnoId} · MATUTINO",
                        color = Color.White.copy(alpha = 0.6f))
                    Spacer(Modifier.height(6.dp))
                    Text(TurnoState.horario, fontSize = 28.sp, fontFamily = FontFamily.Serif,
                        fontWeight = FontWeight.Normal, color = Color.White, letterSpacing = (-0.5).sp)
                    Spacer(Modifier.height(12.dp))
                    Box(modifier = Modifier.fillMaxWidth().height(1.dp)
                        .background(Color.White.copy(alpha = 0.12f)))
                    Spacer(Modifier.height(12.dp))
                    Row(modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween) {
                        TurnoStat("MOVS", "${TurnoState.movimientos}")
                        TurnoStat("ENTREGAS", "${TurnoState.entregas}")
                        TurnoStat("RETORNOS", "${TurnoState.retornos}")
                        TurnoStat("EN CAJA",
                            "\$${"%,d".format(TurnoState.totalRecibido)}", LucianosPrimary)
                    }
                }
            }

            // Empleado asignado
            SectionEyebrow(text = "Empleado asignado")
            Surface(modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(14.dp),
                color = Color.White,
                border = androidx.compose.foundation.BorderStroke(1.dp, LucianosHairline)) {
                Row(modifier = Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                    AvatarCircle(initials = AuthState.currentInitials.ifEmpty { "??" }, size = 36.dp)
                    Spacer(Modifier.width(12.dp))
                    Column(Modifier.weight(1f)) {
                        Text(AuthState.currentFirstName.ifEmpty { "Empleado" },
                            fontSize = 14.sp, fontWeight = FontWeight.SemiBold,
                            color = LucianosInk, fontFamily = FontFamily.SansSerif)
                        Text("${AuthState.currentRole} · permisos completos",
                            fontSize = 11.sp, color = LucianosInk3, fontFamily = FontFamily.SansSerif,
                            modifier = Modifier.padding(top = 2.dp))
                    }
                    Surface(shape = RoundedCornerShape(999.dp),
                        color = LucianosPrimarySoft) {
                        Text("Activo", modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
                            fontSize = 11.sp, color = LucianosPrimary, fontWeight = FontWeight.SemiBold,
                            fontFamily = FontFamily.SansSerif)
                    }
                }
            }

            // Desglose por método
            SectionEyebrow(text = "Desglose por método")
            Surface(modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(14.dp),
                color = Color.White,
                border = androidx.compose.foundation.BorderStroke(1.dp, LucianosHairline)) {
                Column {
                    MetodoRow("Efectivo recibido", TurnoState.efectivoRecibido, 4, isFirst = true)
                    Divider(color = LucianosHairline, thickness = 1.dp,
                        modifier = Modifier.padding(start = 52.dp))
                    MetodoRow("SPEI", TurnoState.speiRecibido, 5)
                    Divider(color = LucianosHairline, thickness = 1.dp,
                        modifier = Modifier.padding(start = 52.dp))
                    MetodoRow("Por cobrar", 0, 0, isZero = true)
                }
            }

            // Botón acción
            Spacer(Modifier.height(4.dp))
            if (!turnoAbierto) {
                Button(
                    onClick = {
                        TurnoState.openTurno()
                        turnoAbierto = true
                    },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(999.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = LucianosPrimary)
                ) {
                    Text("Abrir turno", fontSize = 15.sp, fontWeight = FontWeight.SemiBold,
                        fontFamily = FontFamily.SansSerif, modifier = Modifier.padding(vertical = 4.dp))
                }
            } else {
                Button(
                    onClick = {
                        TurnoState.resetConteo()
                        navController.navigate(Screen.CajaCierre.route)
                    },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(999.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = LucianosInk)
                ) {
                    Icon(Icons.Filled.Lock, contentDescription = null,
                        modifier = Modifier.size(18.dp))
                    Spacer(Modifier.width(8.dp))
                    Text("Cerrar turno", fontSize = 15.sp, fontWeight = FontWeight.SemiBold,
                        fontFamily = FontFamily.SansSerif, modifier = Modifier.padding(vertical = 4.dp))
                }
            }
            Spacer(Modifier.height(16.dp))
        }
    }
}

@Composable
private fun TurnoStat(label: String, value: String, valueColor: Color = Color.White) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(label, fontSize = 9.sp, color = Color.White.copy(alpha = 0.55f),
            letterSpacing = 0.5.sp, fontFamily = FontFamily.SansSerif, fontWeight = FontWeight.SemiBold)
        Text(value, fontSize = 18.sp, fontFamily = FontFamily.Serif, color = valueColor,
            modifier = Modifier.padding(top = 2.dp))
    }
}

@Composable
private fun MetodoRow(label: String, amount: Int, movs: Int, isFirst: Boolean = false, isZero: Boolean = false) {
    Row(
        modifier = Modifier.fillMaxWidth().padding(horizontal = 14.dp, vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier.size(28.dp).clip(CircleShape).background(LucianosPaperAlt),
            contentAlignment = Alignment.Center
        ) {
            Text(if (isZero) "—" else "$", fontSize = 12.sp, fontWeight = FontWeight.Bold,
                color = if (isZero) LucianosInk3 else LucianosPrimary, fontFamily = FontFamily.Monospace)
        }
        Spacer(Modifier.width(10.dp))
        Column(Modifier.weight(1f)) {
            Text(label, fontSize = 13.sp, fontWeight = FontWeight.SemiBold,
                color = if (isZero) LucianosInk3 else LucianosInk, fontFamily = FontFamily.SansSerif)
            Text("$movs mov.", fontSize = 11.sp, color = LucianosInk3, fontFamily = FontFamily.SansSerif)
        }
        Text("\$${"%,d".format(amount)}", fontSize = 14.sp, fontWeight = FontWeight.Bold,
            fontFamily = FontFamily.Monospace,
            color = if (isZero) LucianosInk3 else LucianosPrimary)
    }
}

// ─── Cierre de turno: conteo de efectivo ─────────────────────────────────────

@Composable
fun CajaCierreScreen(navController: NavController) {
    val denominations = listOf(500, 200, 100, 50, 20)
    var counts by remember {
        mutableStateOf(mapOf(
            500 to TurnoState.billetes500,
            200 to TurnoState.billetes200,
            100 to TurnoState.billetes100,
            50  to TurnoState.billetes50,
            20  to TurnoState.billetes20,
        ))
    }

    val totalContado = counts.entries.sumOf { (denom, qty) -> denom * qty }
    val esperado = TurnoState.fondoInicial + TurnoState.esperadoEnCaja
    val diferencia = totalContado - esperado
    val cuadrada = diferencia == 0

    Column(modifier = Modifier.fillMaxSize().background(LucianosBackground)) {
        Surface(color = Color.White, shadowElevation = 0.dp, modifier = Modifier.fillMaxWidth()) {
            Row(
                modifier = Modifier.fillMaxWidth().statusBarsPadding()
                    .padding(horizontal = 16.dp, vertical = 12.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(
                    modifier = Modifier.size(36.dp).clip(CircleShape).background(LucianosPaperAlt)
                        .border(1.dp, LucianosHairline, CircleShape)
                        .clickable { navController.popBackStack() },
                    contentAlignment = Alignment.Center
                ) {
                    Icon(Icons.Filled.ArrowBack, contentDescription = "Atrás",
                        tint = LucianosInk2, modifier = Modifier.size(18.dp))
                }
                Spacer(Modifier.width(12.dp))
                Column(Modifier.weight(1f)) {
                    Text("Cerrar turno", fontSize = 20.sp, fontWeight = FontWeight.Bold,
                        fontFamily = FontFamily.Serif, color = LucianosInk)
                    Text("${AuthState.currentFirstName} · ${TurnoState.turnoId} · 5h 50min",
                        fontSize = 12.sp, color = LucianosInk3, fontFamily = FontFamily.SansSerif)
                }
                Surface(shape = RoundedCornerShape(999.dp),
                    color = if (cuadrada) LucianosPrimarySoft else LucianosWarnSoft) {
                    Text(if (cuadrada) "Cuadrada" else "Diferencia",
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
                        fontSize = 11.sp, fontWeight = FontWeight.SemiBold,
                        color = if (cuadrada) LucianosPrimary else LucianosWarn,
                        fontFamily = FontFamily.SansSerif)
                }
            }
        }

        Column(
            modifier = Modifier.weight(1f).verticalScroll(rememberScrollState())
                .padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            Spacer(Modifier.height(4.dp))

            // Resumen del turno (dark card)
            Surface(modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(18.dp),
                color = LucianosDarkCard) {
                Column(modifier = Modifier.padding(16.dp)) {
                    SectionEyebrow(text = "Resumen del turno",
                        color = Color.White.copy(alpha = 0.6f))
                    Spacer(Modifier.height(4.dp))
                    Text("\$${"%,d".format(TurnoState.totalRecibido)}",
                        fontSize = 36.sp, fontFamily = FontFamily.Serif,
                        fontWeight = FontWeight.Normal, color = Color.White, letterSpacing = (-1).sp)
                    Spacer(Modifier.height(12.dp))
                    Box(modifier = Modifier.fillMaxWidth().height(1.dp)
                        .background(Color.White.copy(alpha = 0.12f)))
                    Spacer(Modifier.height(12.dp))
                    Row(modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween) {
                        TurnoStat("MOVS", "${TurnoState.movimientos}")
                        TurnoStat("ENTREGAS", "${TurnoState.entregas}")
                        TurnoStat("RETORNOS", "${TurnoState.retornos}")
                    }
                }
            }

            // Conteo de efectivo
            SectionEyebrow(text = "Conteo final · efectivo")
            Surface(modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(14.dp),
                color = Color.White,
                border = androidx.compose.foundation.BorderStroke(1.dp, LucianosHairline)) {
                Column(modifier = Modifier.padding(14.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    denominations.forEach { denom ->
                        val qty = counts[denom] ?: 0
                        val subtotal = denom * qty
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text("\$${"%,d".format(denom)}", fontSize = 12.sp,
                                fontWeight = FontWeight.SemiBold, fontFamily = FontFamily.Monospace,
                                color = LucianosInk, modifier = Modifier.width(54.dp))
                            // − button
                            Box(
                                modifier = Modifier.size(28.dp).clip(RoundedCornerShape(8.dp))
                                    .background(LucianosPaperAlt).clickable {
                                        if (qty > 0) counts = counts + (denom to qty - 1)
                                    },
                                contentAlignment = Alignment.Center
                            ) {
                                Text("−", fontSize = 16.sp, fontWeight = FontWeight.Bold,
                                    color = LucianosInk2, fontFamily = FontFamily.SansSerif)
                            }
                            // qty
                            Text("× $qty", fontSize = 12.sp, fontFamily = FontFamily.Monospace,
                                color = LucianosInk2,
                                modifier = Modifier.width(44.dp).padding(horizontal = 4.dp),
                                textAlign = androidx.compose.ui.text.style.TextAlign.Center)
                            // + button
                            Box(
                                modifier = Modifier.size(28.dp).clip(RoundedCornerShape(8.dp))
                                    .background(LucianosPrimaryLine.copy(alpha = 0.4f)).clickable {
                                        counts = counts + (denom to qty + 1)
                                    },
                                contentAlignment = Alignment.Center
                            ) {
                                Text("+", fontSize = 16.sp, fontWeight = FontWeight.Bold,
                                    color = LucianosPrimary, fontFamily = FontFamily.SansSerif)
                            }
                            Spacer(Modifier.weight(1f))
                            Text("\$${"%,d".format(subtotal)}", fontSize = 13.sp,
                                fontWeight = FontWeight.SemiBold, fontFamily = FontFamily.Monospace,
                                color = if (subtotal > 0) LucianosInk else LucianosInk4)
                        }
                    }
                }
            }

            // Conciliación
            Surface(
                modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(14.dp),
                color = if (cuadrada) LucianosPrimarySoft else LucianosWarnSoft,
                border = androidx.compose.foundation.BorderStroke(1.dp,
                    if (cuadrada) LucianosPrimaryLine else LucianosWarn.copy(alpha = 0.4f))
            ) {
                Column(modifier = Modifier.padding(14.dp),
                    verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    ConcilRow("Contado · efectivo", "\$${"%,d".format(totalContado)}")
                    ConcilRow("− Fondo inicial", "−\$${"%,d".format(TurnoState.fondoInicial)}")
                    Divider(color = if (cuadrada) LucianosPrimaryLine else LucianosWarn.copy(alpha = 0.3f))
                    Row(modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("Esperado en caja", fontSize = 13.sp, fontWeight = FontWeight.Bold,
                            color = if (cuadrada) LucianosPrimaryDark else LucianosWarn,
                            fontFamily = FontFamily.SansSerif)
                        Text("\$${"%,d".format(TurnoState.esperadoEnCaja)}", fontSize = 14.sp,
                            fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace,
                            color = if (cuadrada) LucianosPrimary else LucianosWarn)
                    }
                    if (!cuadrada) {
                        Surface(shape = RoundedCornerShape(8.dp),
                            color = LucianosDangerSoft,
                            border = androidx.compose.foundation.BorderStroke(1.dp,
                                LucianosDanger.copy(alpha = 0.3f))) {
                            Row(modifier = Modifier.fillMaxWidth()
                                .padding(horizontal = 12.dp, vertical = 8.dp),
                                horizontalArrangement = Arrangement.SpaceBetween) {
                                Text("Diferencia", fontSize = 13.sp, fontWeight = FontWeight.Bold,
                                    color = LucianosDanger, fontFamily = FontFamily.SansSerif)
                                Text("${if (diferencia > 0) "+" else ""}\$${"%,d".format(diferencia)}",
                                    fontSize = 14.sp, fontWeight = FontWeight.Bold,
                                    fontFamily = FontFamily.Monospace, color = LucianosDanger)
                            }
                        }
                    }
                }
            }

            if (cuadrada) {
                Surface(modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(12.dp),
                    color = LucianosPrimarySoft,
                    border = androidx.compose.foundation.BorderStroke(1.dp, LucianosPrimaryLine)) {
                    Row(modifier = Modifier.padding(12.dp),
                        verticalAlignment = Alignment.CenterVertically) {
                        Box(modifier = Modifier.size(24.dp).clip(CircleShape)
                            .background(LucianosPrimary), contentAlignment = Alignment.Center) {
                            Icon(Icons.Filled.Check, contentDescription = null,
                                tint = Color.White, modifier = Modifier.size(14.dp))
                        }
                        Spacer(Modifier.width(10.dp))
                        Column {
                            Text("Conciliación cuadrada", fontSize = 13.sp,
                                fontWeight = FontWeight.SemiBold, color = LucianosPrimaryDark,
                                fontFamily = FontFamily.SansSerif)
                            Text("Lo contado coincide con lo esperado.",
                                fontSize = 11.sp, color = LucianosPrimary,
                                fontFamily = FontFamily.SansSerif)
                        }
                    }
                }
            }
            Spacer(Modifier.height(4.dp))
        }

        Surface(shadowElevation = 8.dp, color = Color.White) {
            Row(modifier = Modifier.fillMaxWidth().padding(16.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedButton(
                    onClick = { /* tomar foto */ },
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(999.dp),
                    colors = ButtonDefaults.outlinedButtonColors(contentColor = LucianosInk)
                ) {
                    Text("📷  Selfie", fontSize = 13.sp, modifier = Modifier.padding(vertical = 2.dp))
                }
                Button(
                    onClick = {
                        TurnoState.billetes500 = counts[500] ?: 0
                        TurnoState.billetes200 = counts[200] ?: 0
                        TurnoState.billetes100 = counts[100] ?: 0
                        TurnoState.billetes50  = counts[50]  ?: 0
                        TurnoState.billetes20  = counts[20]  ?: 0
                        if (cuadrada) {
                            TurnoState.isOpen = false
                            navController.navigate(Screen.CajaOk.route) {
                                popUpTo(Screen.CajaTurno.route) { inclusive = true }
                            }
                        } else {
                            navController.navigate(Screen.CajaJustificacion.route)
                        }
                    },
                    modifier = Modifier.weight(2f),
                    shape = RoundedCornerShape(999.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = LucianosInk)
                ) {
                    Icon(Icons.Filled.Lock, contentDescription = null, modifier = Modifier.size(16.dp))
                    Spacer(Modifier.width(6.dp))
                    Text("Cerrar turno", fontSize = 14.sp, fontWeight = FontWeight.SemiBold,
                        fontFamily = FontFamily.SansSerif, modifier = Modifier.padding(vertical = 2.dp))
                }
            }
        }
    }
}

@Composable
private fun ConcilRow(label: String, value: String) {
    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
        Text(label, fontSize = 12.sp, color = LucianosInk2, fontFamily = FontFamily.SansSerif)
        Text(value, fontSize = 12.sp, fontFamily = FontFamily.Monospace,
            fontWeight = FontWeight.Medium, color = LucianosInk)
    }
}

// ─── Justificación de diferencia ─────────────────────────────────────────────

@Composable
fun CajaJustificacionScreen(navController: NavController) {
    val causas = listOf("Error conteo", "Vuelto erróneo", "Reembolso no reg.", "Robo", "Otro")
    var causaSelected by remember { mutableStateOf(TurnoState.justificacionCausa) }
    var nota by remember { mutableStateOf(TurnoState.justificacionNota) }
    val diferencia = TurnoState.billetes500 * 500 + TurnoState.billetes200 * 200 +
        TurnoState.billetes100 * 100 + TurnoState.billetes50 * 50 + TurnoState.billetes20 * 20 -
        TurnoState.fondoInicial - TurnoState.esperadoEnCaja
    val ready = causaSelected.isNotEmpty()

    Column(modifier = Modifier.fillMaxSize().background(LucianosBackground)) {
        Surface(color = Color.White, shadowElevation = 0.dp, modifier = Modifier.fillMaxWidth()) {
            Row(
                modifier = Modifier.fillMaxWidth().statusBarsPadding()
                    .padding(horizontal = 16.dp, vertical = 12.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(
                    modifier = Modifier.size(36.dp).clip(CircleShape).background(LucianosPaperAlt)
                        .border(1.dp, LucianosHairline, CircleShape)
                        .clickable { navController.popBackStack() },
                    contentAlignment = Alignment.Center
                ) {
                    Icon(Icons.Filled.ArrowBack, contentDescription = "Atrás",
                        tint = LucianosInk2, modifier = Modifier.size(18.dp))
                }
                Spacer(Modifier.width(12.dp))
                Column(Modifier.weight(1f)) {
                    Text("Justificar diferencia", fontSize = 20.sp, fontWeight = FontWeight.Bold,
                        fontFamily = FontFamily.Serif, color = LucianosInk)
                    Text("${if (diferencia < 0) "Faltante" else "Sobrante"} · requiere explicación",
                        fontSize = 12.sp, color = LucianosInk3, fontFamily = FontFamily.SansSerif)
                }
            }
        }

        Column(
            modifier = Modifier.weight(1f).verticalScroll(rememberScrollState())
                .padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            Spacer(Modifier.height(4.dp))

            // Diferencia
            Surface(modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(14.dp),
                color = LucianosDangerSoft,
                border = androidx.compose.foundation.BorderStroke(1.dp, LucianosDanger.copy(alpha = 0.3f))) {
                Row(modifier = Modifier.padding(14.dp),
                    verticalAlignment = Alignment.CenterVertically) {
                    Box(modifier = Modifier.size(40.dp).clip(CircleShape)
                        .background(LucianosDanger), contentAlignment = Alignment.Center) {
                        Text("!", fontSize = 20.sp, fontWeight = FontWeight.Bold,
                            color = Color.White, fontFamily = FontFamily.SansSerif)
                    }
                    Spacer(Modifier.width(12.dp))
                    Column {
                        SectionEyebrow(text = if (diferencia < 0) "FALTANTE" else "SOBRANTE",
                            color = LucianosDanger)
                        Text("${if (diferencia > 0) "+" else ""}\$${"%,d".format(diferencia)}",
                            fontSize = 28.sp, fontFamily = FontFamily.Serif,
                            color = LucianosDanger, letterSpacing = (-0.5).sp,
                            modifier = Modifier.padding(top = 2.dp))
                    }
                }
            }

            // Causa
            SectionEyebrow(text = "Causa")
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(6.dp),
                verticalAlignment = Alignment.CenterVertically) {
                causas.take(3).forEach { causa ->
                    val sel = causa == causaSelected
                    Surface(
                        modifier = Modifier.clickable { causaSelected = causa },
                        shape = RoundedCornerShape(999.dp),
                        color = if (sel) LucianosPrimary else Color.White,
                        border = androidx.compose.foundation.BorderStroke(1.dp,
                            if (sel) LucianosPrimary else LucianosHairline)
                    ) {
                        Text(causa, modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                            fontSize = 11.sp, fontWeight = FontWeight.Medium,
                            color = if (sel) Color.White else LucianosInk2,
                            fontFamily = FontFamily.SansSerif)
                    }
                }
            }
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(6.dp),
                verticalAlignment = Alignment.CenterVertically) {
                causas.drop(3).forEach { causa ->
                    val sel = causa == causaSelected
                    Surface(
                        modifier = Modifier.clickable { causaSelected = causa },
                        shape = RoundedCornerShape(999.dp),
                        color = if (sel) LucianosPrimary else Color.White,
                        border = androidx.compose.foundation.BorderStroke(1.dp,
                            if (sel) LucianosPrimary else LucianosHairline)
                    ) {
                        Text(causa, modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                            fontSize = 11.sp, fontWeight = FontWeight.Medium,
                            color = if (sel) Color.White else LucianosInk2,
                            fontFamily = FontFamily.SansSerif)
                    }
                }
            }

            // Nota
            SectionEyebrow(text = "Detalle (nota libre)")
            OutlinedTextField(
                value = nota,
                onValueChange = { nota = it },
                modifier = Modifier.fillMaxWidth().defaultMinSize(minHeight = 80.dp),
                placeholder = { Text("Describe lo que ocurrió…", fontSize = 13.sp,
                    color = LucianosInk4, fontFamily = FontFamily.SansSerif) },
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = LucianosPrimary,
                    unfocusedBorderColor = LucianosHairline,
                    focusedContainerColor = Color.White,
                    unfocusedContainerColor = Color.White
                ),
                shape = RoundedCornerShape(12.dp)
            )

            Surface(modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(12.dp),
                color = LucianosWarnSoft,
                border = androidx.compose.foundation.BorderStroke(1.dp, LucianosWarn.copy(alpha = 0.3f))) {
                Text("El administrador recibirá una notificación al cerrar con diferencia.",
                    modifier = Modifier.padding(12.dp), fontSize = 12.sp,
                    color = LucianosWarn, fontFamily = FontFamily.SansSerif)
            }
            Spacer(Modifier.height(4.dp))
        }

        Surface(shadowElevation = 8.dp, color = Color.White) {
            Button(
                onClick = {
                    if (ready) {
                        TurnoState.justificacionCausa = causaSelected
                        TurnoState.justificacionNota = nota
                        TurnoState.isOpen = false
                        navController.navigate(Screen.CajaOk.route) {
                            popUpTo(Screen.CajaTurno.route) { inclusive = true }
                        }
                    }
                },
                modifier = Modifier.fillMaxWidth().padding(16.dp),
                enabled = ready,
                shape = RoundedCornerShape(999.dp),
                colors = ButtonDefaults.buttonColors(containerColor = LucianosDanger)
            ) {
                Icon(Icons.Filled.Lock, contentDescription = null, modifier = Modifier.size(16.dp))
                Spacer(Modifier.width(8.dp))
                Text("Cerrar turno con diferencia", fontSize = 15.sp,
                    fontWeight = FontWeight.SemiBold, fontFamily = FontFamily.SansSerif,
                    modifier = Modifier.padding(vertical = 4.dp))
            }
        }
    }
}

// ─── Éxito: turno cerrado ─────────────────────────────────────────────────────

@Composable
fun CajaOkScreen(navController: NavController) {
    Box(modifier = Modifier.fillMaxSize().background(LucianosPrimaryDeep)) {
        Box(modifier = Modifier.offset(x = 100.dp, y = (-120).dp).size(300.dp).clip(CircleShape)
            .background(LucianosPrimary.copy(alpha = 0.4f)))

        Column(
            modifier = Modifier.fillMaxSize().statusBarsPadding()
                .padding(horizontal = 28.dp).padding(top = 60.dp, bottom = 32.dp),
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            Column(verticalArrangement = Arrangement.spacedBy(18.dp)) {
                Box(modifier = Modifier.size(72.dp).clip(CircleShape).background(LucianosPrimary),
                    contentAlignment = Alignment.Center) {
                    Icon(Icons.Filled.Lock, contentDescription = null,
                        tint = Color.White, modifier = Modifier.size(34.dp))
                }

                Column {
                    Text("TURNO CERRADO", fontSize = 11.sp, fontWeight = FontWeight.SemiBold,
                        letterSpacing = 1.5.sp, color = Color.White.copy(alpha = 0.6f),
                        fontFamily = FontFamily.SansSerif)
                    Spacer(Modifier.height(6.dp))
                    Text("¡Listo!\nTurno ${TurnoState.turnoId} registrado.", fontSize = 34.sp,
                        fontFamily = FontFamily.Serif, fontWeight = FontWeight.Normal,
                        color = Color.White, lineHeight = 38.sp)
                }

                Surface(shape = RoundedCornerShape(16.dp),
                    color = Color.White.copy(alpha = 0.08f),
                    border = androidx.compose.foundation.BorderStroke(1.dp, Color.White.copy(alpha = 0.15f)),
                    modifier = Modifier.fillMaxWidth()) {
                    Column(modifier = Modifier.padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        OkRow("Total recibido", "\$${"%,d".format(TurnoState.totalRecibido)}")
                        OkRow("Movimientos", "${TurnoState.movimientos}")
                        OkRow("Entregas", "${TurnoState.entregas}")
                        OkRow("Devoluciones", "${TurnoState.retornos}")
                    }
                }
            }

            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Button(
                    onClick = { navController.navigate(Screen.Home.route) { popUpTo(0) { inclusive = true } } },
                    modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(999.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = Color.White)
                ) {
                    Text("Volver al inicio", fontSize = 14.sp, fontWeight = FontWeight.SemiBold,
                        color = LucianosInk, modifier = Modifier.padding(vertical = 4.dp))
                }
                OutlinedButton(
                    onClick = { },
                    modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(999.dp),
                    colors = ButtonDefaults.outlinedButtonColors(contentColor = Color.White),
                    border = androidx.compose.foundation.BorderStroke(1.dp, Color.White.copy(alpha = 0.3f))
                ) {
                    Text("📄  Exportar reporte", fontSize = 14.sp, fontWeight = FontWeight.SemiBold,
                        modifier = Modifier.padding(vertical = 4.dp))
                }
            }
        }
    }
}

@Composable
private fun OkRow(label: String, value: String) {
    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
        Text(label, fontSize = 12.sp, color = Color.White.copy(alpha = 0.65f),
            fontFamily = FontFamily.SansSerif)
        Text(value, fontSize = 12.sp, color = Color.White, fontFamily = FontFamily.SansSerif,
            fontWeight = FontWeight.Medium)
    }
}
