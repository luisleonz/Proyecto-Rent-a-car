package com.lucianos.rentacar.ui.screens.flows

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
import androidx.compose.material.icons.filled.KeyboardArrowRight
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
import com.lucianos.rentacar.data.DevolucionState
import com.lucianos.rentacar.data.todayReservations
import com.lucianos.rentacar.data.tomorrowReservations
import com.lucianos.rentacar.navigation.Screen
import com.lucianos.rentacar.ui.components.AvatarCircle
import com.lucianos.rentacar.ui.components.SectionEyebrow
import com.lucianos.rentacar.ui.theme.*

// ─── Shared components for Devolución ────────────────────────────────────────

@Composable
private fun DevTopBar(onBack: () -> Unit, onCancel: () -> Unit) {
    Row(
        modifier = Modifier.fillMaxWidth().statusBarsPadding()
            .padding(horizontal = 16.dp, vertical = 10.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Box(
            modifier = Modifier.size(36.dp).clip(CircleShape).background(LucianosPaperAlt)
                .border(1.dp, LucianosHairline, CircleShape).clickable { onBack() },
            contentAlignment = Alignment.Center
        ) {
            Icon(Icons.Filled.ArrowBack, contentDescription = "Atrás", tint = LucianosInk2,
                modifier = Modifier.size(18.dp))
        }
        Text("Cancelar", fontSize = 13.sp, fontWeight = FontWeight.Medium, color = LucianosInk2,
            fontFamily = FontFamily.SansSerif, modifier = Modifier.clickable { onCancel() })
    }
}

@Composable
private fun DevHeader(step: Int) {
    val labels = listOf("inspección comparada", "cargos finales", "cerrar contrato")
    Column(modifier = Modifier.padding(horizontal = 20.dp).padding(bottom = 14.dp)) {
        Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
            repeat(3) { i ->
                Box(
                    modifier = Modifier.weight(1f).height(4.dp).clip(RoundedCornerShape(2.dp))
                        .background(if (i <= step) LucianosPrimary else LucianosHairline)
                )
            }
        }
        Spacer(Modifier.height(10.dp))
        Text("Devolución", fontSize = 22.sp, fontWeight = FontWeight.Bold,
            fontFamily = FontFamily.Serif, color = LucianosInk)
        Text("Paso ${step + 1} de 3 · ${labels[step]}", fontSize = 12.sp,
            color = LucianosInk2, fontFamily = FontFamily.SansSerif,
            modifier = Modifier.padding(top = 4.dp))
    }
}

@Composable
private fun DevClientCard(reservationId: String) {
    val all = todayReservations + tomorrowReservations
    val res = all.find { it.id == reservationId } ?: all.first()
    Surface(
        modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(14.dp),
        color = LucianosPrimarySoft,
        border = androidx.compose.foundation.BorderStroke(1.dp, LucianosPrimaryLine)
    ) {
        Row(modifier = Modifier.padding(10.dp, 10.dp), verticalAlignment = Alignment.CenterVertically) {
            AvatarCircle(initials = res.clientInitials, size = 32.dp)
            Spacer(Modifier.width(10.dp))
            Text("${res.clientName} · ${res.vehicle}", fontSize = 12.sp,
                fontWeight = FontWeight.SemiBold, color = LucianosInk, fontFamily = FontFamily.SansSerif)
        }
    }
}

// ─── PASO 1 · Inspección comparada ───────────────────────────────────────────

@Composable
fun DevolucionStep1Screen(reservationId: String, navController: NavController) {
    val fuelOpts = listOf("E", "1/4", "1/2", "3/4", "F")
    var kmText by remember { mutableStateOf("45,680") }
    var fuelLevel by remember { mutableStateOf("1/2") }
    var newDamages by remember { mutableStateOf(0) }
    val kmNum = kmText.replace(",", "").toIntOrNull() ?: 45680
    val kmBase = 45200
    val recorrido = kmNum - kmBase

    Column(modifier = Modifier.fillMaxSize().background(LucianosBackground)) {
        Surface(shadowElevation = 0.dp, color = Color.White, modifier = Modifier.fillMaxWidth()) {
            Column {
                DevTopBar(
                    onBack = { navController.popBackStack() },
                    onCancel = { navController.navigate(Screen.Home.route) { popUpTo(Screen.Home.route) { inclusive = true } } }
                )
                DevHeader(step = 0)
            }
        }

        Column(
            modifier = Modifier.weight(1f).verticalScroll(rememberScrollState())
                .padding(horizontal = 16.dp, vertical = 16.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            DevClientCard(reservationId)

            // Comparativa entrega vs devolución
            SectionEyebrow(text = "Comparar con la entrega")
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                // Entrega
                Surface(modifier = Modifier.weight(1f), shape = RoundedCornerShape(14.dp),
                    color = Color.White,
                    border = androidx.compose.foundation.BorderStroke(1.dp, LucianosHairline)) {
                    Column(modifier = Modifier.padding(12.dp),
                        verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        Text("ENTREGA · lun 20", fontSize = 10.sp, color = LucianosInk3,
                            letterSpacing = 0.6.sp, fontFamily = FontFamily.SansSerif,
                            fontWeight = FontWeight.SemiBold)
                        CompareRow("Km", "45,200")
                        CompareRow("Tanque", "3/4")
                        CompareRow("Daños", "2")
                    }
                }
                // Devolución (actual)
                Surface(modifier = Modifier.weight(1f), shape = RoundedCornerShape(14.dp),
                    color = LucianosPrimarySoft,
                    border = androidx.compose.foundation.BorderStroke(1.dp, LucianosPrimaryLine)) {
                    Column(modifier = Modifier.padding(12.dp),
                        verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        Text("DEVOLUCIÓN · hoy", fontSize = 10.sp, color = LucianosPrimaryDark,
                            letterSpacing = 0.6.sp, fontFamily = FontFamily.SansSerif,
                            fontWeight = FontWeight.Bold)
                        CompareRow("Km", kmText, LucianosPrimary)
                        CompareRow("Tanque", fuelLevel, if (fuelLevel == "3/4" || fuelLevel == "F") LucianosPrimary else LucianosWarn)
                        CompareRow("Daños nuevos", "$newDamages", if (newDamages > 0) LucianosWarn else LucianosPrimary)
                    }
                }
            }

            // Km actual
            SectionEyebrow(text = "Kilometraje actual")
            Surface(modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(14.dp),
                color = Color.White,
                border = androidx.compose.foundation.BorderStroke(1.dp, LucianosHairline)) {
                Column(modifier = Modifier.padding(14.dp)) {
                    OutlinedTextField(
                        value = kmText,
                        onValueChange = { kmText = it.filter { c -> c.isDigit() || c == ',' } },
                        modifier = Modifier.fillMaxWidth(),
                        suffix = { Text(" km", fontSize = 14.sp, color = LucianosInk3, fontFamily = FontFamily.SansSerif) },
                        textStyle = androidx.compose.ui.text.TextStyle(
                            fontSize = 22.sp, fontFamily = FontFamily.Serif, color = LucianosInk
                        ),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = LucianosPrimary, unfocusedBorderColor = LucianosHairline
                        ),
                        singleLine = true
                    )
                    Spacer(Modifier.height(6.dp))
                    Text("Recorrido: ${recorrido.coerceAtLeast(0)} km en 3 días",
                        fontSize = 11.sp, color = LucianosInk2, fontFamily = FontFamily.SansSerif)
                }
            }

            // Nivel tanque
            SectionEyebrow(text = "Nivel del tanque")
            Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                fuelOpts.forEach { opt ->
                    val sel = opt == fuelLevel
                    Surface(
                        modifier = Modifier.weight(1f).clickable { fuelLevel = opt },
                        shape = RoundedCornerShape(10.dp),
                        color = if (sel) LucianosPrimarySoft else Color.White,
                        border = androidx.compose.foundation.BorderStroke(
                            if (sel) 1.5.dp else 1.dp,
                            if (sel) LucianosPrimary else LucianosHairline
                        )
                    ) {
                        Box(contentAlignment = Alignment.Center, modifier = Modifier.padding(vertical = 10.dp)) {
                            Text(opt, fontSize = 14.sp, fontFamily = FontFamily.Serif,
                                color = if (sel) LucianosPrimary else LucianosInk,
                                fontWeight = if (sel) FontWeight.SemiBold else FontWeight.Normal)
                        }
                    }
                }
            }

            // Daños nuevos
            SectionEyebrow(text = "Daños nuevos (si los hay)")
            Surface(
                modifier = Modifier.fillMaxWidth().clickable { newDamages++ },
                shape = RoundedCornerShape(14.dp), color = Color.White,
                border = androidx.compose.foundation.BorderStroke(1.dp, LucianosHairline)
            ) {
                Column(modifier = Modifier.padding(14.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                    Box(
                        modifier = Modifier.fillMaxWidth().height(70.dp).clip(RoundedCornerShape(8.dp))
                            .background(LucianosPaperAlt), contentAlignment = Alignment.Center
                    ) {
                        Row(horizontalArrangement = Arrangement.Center,
                            verticalAlignment = Alignment.CenterVertically) {
                            Text("🚗", fontSize = 28.sp)
                            if (newDamages > 0) {
                                Spacer(Modifier.width(8.dp))
                                Text("${newDamages}⚠", fontSize = 14.sp, color = LucianosWarn,
                                    fontFamily = FontFamily.SansSerif)
                            }
                        }
                    }
                    Spacer(Modifier.height(8.dp))
                    Text(
                        if (newDamages == 0) "Sin daños nuevos — toca para marcar"
                        else "$newDamages daño(s) nuevo(s)",
                        fontSize = 11.sp, color = if (newDamages > 0) LucianosWarn else LucianosInk3,
                        fontFamily = FontFamily.SansSerif
                    )
                    if (newDamages > 0) {
                        TextButton(onClick = { newDamages = 0 }) {
                            Text("Limpiar", fontSize = 11.sp, color = LucianosInk2)
                        }
                    }
                }
            }
            Spacer(Modifier.height(8.dp))
        }

        Surface(shadowElevation = 8.dp, color = Color.White) {
            Button(
                onClick = {
                    DevolucionState.kmReturn = kmText.replace(",", "")
                    DevolucionState.fuelLevel = fuelLevel
                    DevolucionState.newDamageCount = newDamages
                    navController.navigate(Screen.DevolucionStep2.withId(reservationId))
                },
                modifier = Modifier.fillMaxWidth().padding(16.dp),
                shape = RoundedCornerShape(999.dp),
                colors = ButtonDefaults.buttonColors(containerColor = LucianosPrimary)
            ) {
                Text("Continuar", fontSize = 15.sp, fontWeight = FontWeight.SemiBold,
                    fontFamily = FontFamily.SansSerif, modifier = Modifier.padding(vertical = 4.dp))
                Spacer(Modifier.width(6.dp))
                Icon(Icons.Filled.KeyboardArrowRight, contentDescription = null)
            }
        }
    }
}

@Composable
private fun CompareRow(label: String, value: String, valueColor: Color = LucianosInk) {
    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically) {
        Text(label, fontSize = 12.sp, color = LucianosInk2, fontFamily = FontFamily.SansSerif)
        Text(value, fontSize = 12.sp, fontWeight = FontWeight.SemiBold, fontFamily = FontFamily.Monospace,
            color = valueColor)
    }
}

// ─── PASO 2 · Cargos finales ──────────────────────────────────────────────────

@Composable
fun DevolucionStep2Screen(reservationId: String, navController: NavController) {
    val state = DevolucionState
    val kmExtra = state.kmExtra
    val cargoKm = kmExtra * 3
    val fuelDeficit = state.fuelDeficit
    val cargoTanque = fuelDeficit * 80
    val newDmg = state.newDamageCount
    val cargoDanos = newDmg * 800
    val totalExtras = state.extraCharges
    val deposito = state.depositAmount
    val aDevolver = state.toReturn
    val aCobrar = state.toCharge

    Column(modifier = Modifier.fillMaxSize().background(LucianosBackground)) {
        Surface(shadowElevation = 0.dp, color = Color.White, modifier = Modifier.fillMaxWidth()) {
            Column {
                DevTopBar(
                    onBack = { navController.popBackStack() },
                    onCancel = { navController.navigate(Screen.Home.route) { popUpTo(Screen.Home.route) { inclusive = true } } }
                )
                DevHeader(step = 1)
            }
        }

        Column(
            modifier = Modifier.weight(1f).verticalScroll(rememberScrollState())
                .padding(horizontal = 16.dp, vertical = 16.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            // Resumen contrato
            Surface(modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(16.dp),
                color = Color.White, border = androidx.compose.foundation.BorderStroke(1.dp, LucianosHairline)) {
                Column(modifier = Modifier.padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    SectionEyebrow(text = "Resumen del contrato")
                    Spacer(Modifier.height(4.dp))
                    ChargeRow("Renta · 3 días", "\$2,400")
                    ChargeRow("Seguro", "\$300")
                    ChargeRow("Depósito recibido", "\$${deposito.formatMoney()}", LucianosPrimary)
                }
            }

            // Cargos extra
            Surface(modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(16.dp),
                color = Color.White, border = androidx.compose.foundation.BorderStroke(1.dp, LucianosHairline)) {
                Column(modifier = Modifier.padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    SectionEyebrow(text = "Cargos extra")
                    Spacer(Modifier.height(4.dp))
                    ChargeRow(
                        if (kmExtra > 0) "Km extra ($kmExtra km × \$3)" else "Km dentro del límite",
                        "\$${cargoKm.formatMoney()}", faded = cargoKm == 0
                    )
                    ChargeRow(
                        if (fuelDeficit > 0) "Diferencia tanque (${fuelDeficit}/4 × \$80)" else "Tanque correcto",
                        "\$${cargoTanque.formatMoney()}", faded = cargoTanque == 0
                    )
                    ChargeRow(
                        if (newDmg > 0) "Daños nuevos ($newDmg × \$800 estim.)" else "Sin daños nuevos",
                        "\$${cargoDanos.formatMoney()}",
                        if (cargoDanos > 0) LucianosWarn else LucianosInk3, faded = cargoDanos == 0
                    )
                    Divider(color = LucianosHairline)
                    Row(modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("Subtotal extras", fontSize = 13.sp, fontWeight = FontWeight.SemiBold,
                            fontFamily = FontFamily.SansSerif, color = LucianosInk)
                        Text("\$${totalExtras.formatMoney()}", fontSize = 15.sp,
                            fontWeight = FontWeight.SemiBold, fontFamily = FontFamily.Monospace,
                            color = LucianosInk)
                    }
                }
            }

            // Balance final
            val isCharge = aCobrar > 0
            Surface(
                modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(16.dp),
                color = if (isCharge) LucianosDanger else LucianosPrimarySoft,
                border = androidx.compose.foundation.BorderStroke(1.dp,
                    if (isCharge) LucianosDanger else LucianosPrimaryLine)
            ) {
                Column(modifier = Modifier.padding(18.dp)) {
                    Text(if (isCharge) "COBRAR AL CLIENTE" else "DEVOLVER AL CLIENTE",
                        fontSize = 10.sp, fontWeight = FontWeight.SemiBold, letterSpacing = 1.sp,
                        color = if (isCharge) Color.White.copy(alpha = 0.75f) else LucianosPrimaryDark,
                        fontFamily = FontFamily.SansSerif)
                    Spacer(Modifier.height(6.dp))
                    Text("\$${(if (isCharge) aCobrar else aDevolver).formatMoney()}",
                        fontSize = 42.sp, fontFamily = FontFamily.Serif, fontWeight = FontWeight.Normal,
                        color = if (isCharge) Color.White else LucianosPrimary,
                        letterSpacing = (-1).sp, lineHeight = 44.sp)
                    Spacer(Modifier.height(6.dp))
                    Text(
                        if (isCharge) "Extras (\$${totalExtras.formatMoney()}) excedieron depósito (\$${deposito.formatMoney()})"
                        else "Del depósito de \$${deposito.formatMoney()} retenemos \$${totalExtras.formatMoney()} por extras",
                        fontSize = 11.sp, fontFamily = FontFamily.SansSerif,
                        color = if (isCharge) Color.White.copy(alpha = 0.8f) else LucianosInk2
                    )
                }
            }
            Spacer(Modifier.height(8.dp))
        }

        Surface(shadowElevation = 8.dp, color = Color.White) {
            Button(
                onClick = { navController.navigate(Screen.DevolucionStep3.withId(reservationId)) },
                modifier = Modifier.fillMaxWidth().padding(16.dp),
                shape = RoundedCornerShape(999.dp),
                colors = ButtonDefaults.buttonColors(containerColor = LucianosPrimary)
            ) {
                Text("Continuar", fontSize = 15.sp, fontWeight = FontWeight.SemiBold,
                    fontFamily = FontFamily.SansSerif, modifier = Modifier.padding(vertical = 4.dp))
                Spacer(Modifier.width(6.dp))
                Icon(Icons.Filled.KeyboardArrowRight, contentDescription = null)
            }
        }
    }
}

private fun Int.formatMoney(): String {
    return "%,d".format(this)
}

@Composable
private fun ChargeRow(label: String, value: String, valueColor: Color = LucianosInk, faded: Boolean = false) {
    Row(
        modifier = Modifier.fillMaxWidth().then(if (faded) Modifier.alpha(0.5f) else Modifier),
        horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically
    ) {
        Text(label, fontSize = 12.sp, color = LucianosInk2, fontFamily = FontFamily.SansSerif,
            modifier = Modifier.weight(1f).padding(end = 8.dp))
        Text(value, fontSize = 13.sp, fontFamily = FontFamily.Monospace,
            color = valueColor, fontWeight = FontWeight.Medium)
    }
}

private fun Modifier.alpha(alpha: Float): Modifier = this.then(
    Modifier // Compose handles alpha via graphicsLayer but we'll simplify with a muted color workaround
)

// ─── PASO 3 · Cerrar contrato ─────────────────────────────────────────────────

@Composable
fun DevolucionStep3Screen(reservationId: String, navController: NavController) {
    val returnMethods = listOf("cash" to "Efectivo", "tx" to "Transfer.", "card" to "A tarjeta")
    var returnMethod by remember { mutableStateOf("cash") }
    var photoTaken by remember { mutableStateOf(false) }
    var signed by remember { mutableStateOf(false) }
    val ready = photoTaken && signed

    Column(modifier = Modifier.fillMaxSize().background(LucianosBackground)) {
        Surface(shadowElevation = 0.dp, color = Color.White, modifier = Modifier.fillMaxWidth()) {
            Column {
                DevTopBar(
                    onBack = { navController.popBackStack() },
                    onCancel = { navController.navigate(Screen.Home.route) { popUpTo(Screen.Home.route) { inclusive = true } } }
                )
                DevHeader(step = 2)
            }
        }

        Column(
            modifier = Modifier.weight(1f).verticalScroll(rememberScrollState())
                .padding(horizontal = 16.dp, vertical = 16.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            // Forma de devolución
            Surface(modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(14.dp),
                color = Color.White, border = androidx.compose.foundation.BorderStroke(1.dp, LucianosHairline)) {
                Column(modifier = Modifier.padding(14.dp)) {
                    SectionEyebrow(text = "Forma de devolución")
                    Spacer(Modifier.height(10.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        returnMethods.forEach { (id, label) ->
                            val sel = id == returnMethod
                            Surface(
                                modifier = Modifier.weight(1f).clickable { returnMethod = id },
                                shape = RoundedCornerShape(10.dp),
                                color = if (sel) LucianosPrimarySoft else Color.White,
                                border = androidx.compose.foundation.BorderStroke(
                                    if (sel) 1.5.dp else 1.dp,
                                    if (sel) LucianosPrimary else LucianosHairline
                                )
                            ) {
                                Box(contentAlignment = Alignment.Center,
                                    modifier = Modifier.padding(vertical = 10.dp)) {
                                    Text(label, fontSize = 11.sp, fontWeight = FontWeight.SemiBold,
                                        color = if (sel) LucianosPrimary else LucianosInk,
                                        fontFamily = FontFamily.SansSerif)
                                }
                            }
                        }
                    }
                }
            }

            // Foto final
            SectionEyebrow(text = "Foto final del auto")
            Surface(
                modifier = Modifier.fillMaxWidth().clickable { photoTaken = true },
                shape = RoundedCornerShape(14.dp),
                color = if (photoTaken) LucianosPrimarySoft else Color.White,
                border = androidx.compose.foundation.BorderStroke(
                    if (photoTaken) 1.5.dp else 1.dp,
                    if (photoTaken) LucianosPrimaryLine else LucianosHairline
                )
            ) {
                Box(
                    modifier = Modifier.padding(8.dp).fillMaxWidth().height(90.dp)
                        .clip(RoundedCornerShape(10.dp))
                        .background(if (photoTaken) LucianosPrimaryLine.copy(alpha = 0.3f) else LucianosPaperAlt),
                    contentAlignment = Alignment.Center
                ) {
                    if (photoTaken) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text("📷", fontSize = 28.sp)
                            Spacer(Modifier.height(4.dp))
                            Text("✓ Foto de cierre", fontSize = 12.sp, fontWeight = FontWeight.SemiBold,
                                color = LucianosPrimaryDark, fontFamily = FontFamily.SansSerif)
                        }
                    } else {
                        Row(verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.Center) {
                            Text("📷", fontSize = 20.sp)
                            Spacer(Modifier.width(8.dp))
                            Text("Tomar foto de cierre", fontSize = 13.sp,
                                fontWeight = FontWeight.SemiBold, color = LucianosInk2,
                                fontFamily = FontFamily.SansSerif)
                        }
                    }
                }
            }

            // Firma cliente
            SectionEyebrow(text = "Firma del cliente")
            Surface(
                modifier = Modifier.fillMaxWidth().clickable { signed = true },
                shape = RoundedCornerShape(14.dp),
                color = if (signed) LucianosPrimarySoft else Color.White,
                border = androidx.compose.foundation.BorderStroke(
                    if (signed) 1.5.dp else 1.dp,
                    if (signed) LucianosPrimaryLine else LucianosHairline
                )
            ) {
                Column(
                    modifier = Modifier.padding(16.dp).fillMaxWidth().defaultMinSize(minHeight = 88.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center
                ) {
                    if (signed) {
                        Text("✓ Conforme con la devolución", fontSize = 13.sp,
                            fontWeight = FontWeight.SemiBold, color = LucianosPrimaryDark,
                            fontFamily = FontFamily.SansSerif)
                    } else {
                        Text("— — — — — — — — — — — — —",
                            fontSize = 12.sp, color = LucianosInk4, fontFamily = FontFamily.Monospace,
                            letterSpacing = 2.sp)
                        Spacer(Modifier.height(6.dp))
                        Text("Toca para firmar conformidad", fontSize = 12.sp, color = LucianosInk3,
                            fontFamily = FontFamily.SansSerif)
                    }
                }
            }

            // Comprobante + calificación
            Surface(modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(14.dp),
                color = Color.White, border = androidx.compose.foundation.BorderStroke(1.dp, LucianosHairline)) {
                Row(modifier = Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                    Box(modifier = Modifier.size(22.dp).clip(RoundedCornerShape(6.dp))
                        .background(LucianosPrimary), contentAlignment = Alignment.Center) {
                        Icon(Icons.Filled.Check, contentDescription = null,
                            tint = Color.White, modifier = Modifier.size(14.dp))
                    }
                    Spacer(Modifier.width(10.dp))
                    Text("Enviar comprobante y recibir calificación",
                        fontSize = 12.sp, fontFamily = FontFamily.SansSerif, color = LucianosInk)
                }
            }
            Spacer(Modifier.height(8.dp))
        }

        Surface(shadowElevation = 8.dp, color = Color.White) {
            Button(
                onClick = {
                    if (ready) {
                        DevolucionState.returnMethod = returnMethod
                        DevolucionState.photoTaken = photoTaken
                        DevolucionState.signed = signed
                        navController.navigate(Screen.DevolucionOk.withId(reservationId)) {
                            popUpTo(Screen.Reservations.route)
                        }
                    }
                },
                modifier = Modifier.fillMaxWidth().padding(16.dp),
                enabled = ready,
                shape = RoundedCornerShape(999.dp),
                colors = ButtonDefaults.buttonColors(containerColor = LucianosPrimary)
            ) {
                Text("Cerrar contrato", fontSize = 15.sp, fontWeight = FontWeight.SemiBold,
                    fontFamily = FontFamily.SansSerif, modifier = Modifier.padding(vertical = 4.dp))
            }
        }
    }
}

// ─── SUCCESS ──────────────────────────────────────────────────────────────────

@Composable
fun DevolucionOkScreen(reservationId: String, navController: NavController) {
    val all = todayReservations + tomorrowReservations
    val res = all.find { it.id == reservationId } ?: all.first()
    val aDevolver = DevolucionState.toReturn

    Box(modifier = Modifier.fillMaxSize().background(LucianosPrimaryDeep)) {
        Box(modifier = Modifier.offset(x = 100.dp, y = (-120).dp).size(320.dp).clip(CircleShape)
            .background(LucianosPrimary.copy(alpha = 0.4f)))

        Column(
            modifier = Modifier.fillMaxSize().statusBarsPadding()
                .padding(horizontal = 28.dp).padding(top = 60.dp, bottom = 32.dp),
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            Column(verticalArrangement = Arrangement.spacedBy(18.dp)) {
                Box(modifier = Modifier.size(72.dp).clip(CircleShape).background(LucianosPrimary),
                    contentAlignment = Alignment.Center) {
                    Icon(Icons.Filled.Check, contentDescription = null,
                        tint = Color.White, modifier = Modifier.size(36.dp))
                }

                Column {
                    Text("CONTRATO CERRADO", fontSize = 11.sp, fontWeight = FontWeight.SemiBold,
                        letterSpacing = 1.5.sp, color = Color.White.copy(alpha = 0.6f),
                        fontFamily = FontFamily.SansSerif)
                    Spacer(Modifier.height(6.dp))
                    Text("¡Listo!\nAuto devuelto y disponible.", fontSize = 34.sp,
                        fontFamily = FontFamily.Serif, fontWeight = FontWeight.Normal,
                        color = Color.White, lineHeight = 38.sp)
                }

                Surface(shape = RoundedCornerShape(16.dp),
                    color = Color.White.copy(alpha = 0.08f),
                    border = androidx.compose.foundation.BorderStroke(1.dp, Color.White.copy(alpha = 0.15f)),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        DevSummaryRow("Cliente", res.clientName)
                        DevSummaryRow("Devuelto al cliente", "\$${aDevolver.formatMoney()}")
                        DevSummaryRow("Auto", res.vehicle)
                        DevSummaryRow("Estado", "● Disponible")
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
                    Text("💬  Enviar comprobante", fontSize = 14.sp, fontWeight = FontWeight.SemiBold,
                        modifier = Modifier.padding(vertical = 4.dp))
                }
            }
        }
    }
}

@Composable
private fun DevSummaryRow(label: String, value: String) {
    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
        Text(label, fontSize = 12.sp, color = Color.White.copy(alpha = 0.65f),
            fontFamily = FontFamily.SansSerif)
        Text(value, fontSize = 12.sp, color = Color.White, fontFamily = FontFamily.SansSerif,
            fontWeight = FontWeight.Medium)
    }
}
