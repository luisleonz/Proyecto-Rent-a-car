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
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.KeyboardArrowRight
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import com.lucianos.rentacar.data.EntregaState
import com.lucianos.rentacar.data.todayReservations
import com.lucianos.rentacar.data.tomorrowReservations
import com.lucianos.rentacar.navigation.Screen
import com.lucianos.rentacar.ui.components.AvatarCircle
import com.lucianos.rentacar.ui.components.SectionEyebrow
import com.lucianos.rentacar.ui.theme.*

// ─── Shared header with progress bar ─────────────────────────────────────────

@Composable
private fun FlowTopBar(onBack: () -> Unit, onCancel: () -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .statusBarsPadding()
            .padding(horizontal = 16.dp, vertical = 10.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Box(
            modifier = Modifier
                .size(36.dp)
                .clip(CircleShape)
                .background(LucianosPaperAlt)
                .border(1.dp, LucianosHairline, CircleShape)
                .clickable { onBack() },
            contentAlignment = Alignment.Center
        ) {
            Icon(Icons.Filled.ArrowBack, contentDescription = "Atrás", tint = LucianosInk2, modifier = Modifier.size(18.dp))
        }
        Text(
            text = "Cancelar",
            fontSize = 13.sp,
            fontWeight = FontWeight.Medium,
            color = LucianosInk2,
            fontFamily = FontFamily.SansSerif,
            modifier = Modifier.clickable { onCancel() }
        )
    }
}

@Composable
private fun EntregaHeader(step: Int) {
    val labels = listOf("documentos y firma", "inspección + fotos", "cobro")
    Column(modifier = Modifier.padding(horizontal = 20.dp).padding(bottom = 14.dp)) {
        Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
            repeat(3) { i ->
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .height(4.dp)
                        .clip(RoundedCornerShape(2.dp))
                        .background(if (i <= step) LucianosPrimary else LucianosHairline)
                )
            }
        }
        Spacer(Modifier.height(10.dp))
        Text("Entrega · check-in", fontSize = 22.sp, fontWeight = FontWeight.Bold,
            fontFamily = FontFamily.Serif, color = LucianosInk)
        Text("Paso ${step + 1} de 3 · ${labels[step]}", fontSize = 12.sp,
            color = LucianosInk2, fontFamily = FontFamily.SansSerif, modifier = Modifier.padding(top = 4.dp))
    }
}

@Composable
private fun ClientCard(reservationId: String) {
    val all = todayReservations + tomorrowReservations
    val res = all.find { it.id == reservationId } ?: all.first()
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(14.dp),
        color = LucianosPrimarySoft,
        border = androidx.compose.foundation.BorderStroke(1.dp, LucianosPrimaryLine)
    ) {
        Row(modifier = Modifier.padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
            AvatarCircle(initials = res.clientInitials, size = 42.dp)
            Spacer(Modifier.width(12.dp))
            Column {
                Text(res.clientName, fontSize = 14.sp, fontWeight = FontWeight.SemiBold,
                    color = LucianosInk, fontFamily = FontFamily.SansSerif)
                Text("${res.vehicle} · ${res.type} · 3 días",
                    fontSize = 11.sp, color = LucianosInk2, fontFamily = FontFamily.SansSerif,
                    modifier = Modifier.padding(top = 2.dp))
            }
        }
    }
}

// ─── PASO 1 · Documentos + Firma ─────────────────────────────────────────────

@Composable
fun EntregaStep1Screen(reservationId: String, navController: NavController) {
    var docLic by remember { mutableStateOf(EntregaState.docLic) }
    var docIne by remember { mutableStateOf(EntregaState.docIne) }
    var docDom by remember { mutableStateOf(EntregaState.docDom) }
    var docTarj by remember { mutableStateOf(EntregaState.docTarj) }
    var signed by remember { mutableStateOf(EntregaState.signed) }

    val docs = listOf(
        Triple("lic", "Licencia vigente", "foto del frente") to { v: Boolean -> docLic = v },
        Triple("ine", "INE / pasaporte", "frente y reverso") to { v: Boolean -> docIne = v },
        Triple("dom", "Comprobante domicilio", "no mayor a 3 meses") to { v: Boolean -> docDom = v },
        Triple("tarj", "Tarjeta de garantía", "depósito") to { v: Boolean -> docTarj = v },
    )
    val docValues = listOf(docLic, docIne, docDom, docTarj)
    val allDocs = docValues.all { it }
    val ready = allDocs && signed

    Column(
        modifier = Modifier.fillMaxSize().background(LucianosBackground)
    ) {
        Surface(shadowElevation = 0.dp, color = Color.White, modifier = Modifier.fillMaxWidth()) {
            Column {
                FlowTopBar(
                    onBack = { navController.popBackStack() },
                    onCancel = { navController.navigate(Screen.Home.route) { popUpTo(Screen.Home.route) { inclusive = true } } }
                )
                EntregaHeader(step = 0)
            }
        }

        Column(
            modifier = Modifier
                .weight(1f)
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 16.dp, vertical = 16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            ClientCard(reservationId)

            SectionEyebrow(text = "Verificar documentos")
            Spacer(Modifier.height(0.dp))
            docs.forEachIndexed { index, (info, setter) ->
                val ok = docValues[index]
                Surface(
                    modifier = Modifier.fillMaxWidth().clickable { setter(!ok) },
                    shape = RoundedCornerShape(14.dp),
                    color = if (ok) LucianosPrimarySoft else Color.White,
                    border = androidx.compose.foundation.BorderStroke(
                        if (ok) 1.5.dp else 1.dp,
                        if (ok) LucianosPrimaryLine else LucianosHairline
                    )
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 14.dp, vertical = 12.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Box(
                            modifier = Modifier
                                .size(22.dp)
                                .clip(CircleShape)
                                .background(if (ok) LucianosPrimary else Color.Transparent)
                                .border(2.dp, if (ok) LucianosPrimary else LucianosHairline, CircleShape),
                            contentAlignment = Alignment.Center
                        ) {
                            if (ok) Icon(Icons.Filled.Check, contentDescription = null,
                                tint = Color.White, modifier = Modifier.size(12.dp))
                        }
                        Spacer(Modifier.width(12.dp))
                        Column(Modifier.weight(1f)) {
                            Text(info.second, fontSize = 13.sp, fontWeight = FontWeight.SemiBold,
                                color = if (ok) LucianosPrimaryDark else LucianosInk,
                                fontFamily = FontFamily.SansSerif)
                            Text(info.third, fontSize = 11.sp, color = LucianosInk2,
                                fontFamily = FontFamily.SansSerif, modifier = Modifier.padding(top = 1.dp))
                        }
                        if (!ok) {
                            Surface(
                                shape = RoundedCornerShape(999.dp),
                                border = androidx.compose.foundation.BorderStroke(1.dp, LucianosHairline),
                                color = Color.Transparent
                            ) {
                                Text("Subir", modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
                                    fontSize = 11.sp, fontWeight = FontWeight.SemiBold, color = LucianosInk2,
                                    fontFamily = FontFamily.SansSerif)
                            }
                        }
                    }
                }
            }

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
                    modifier = Modifier.padding(16.dp).fillMaxWidth().defaultMinSize(minHeight = 90.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center
                ) {
                    if (signed) {
                        Text("✓ Firmado", fontSize = 13.sp, fontWeight = FontWeight.SemiBold,
                            color = LucianosPrimaryDark, fontFamily = FontFamily.SansSerif)
                    } else {
                        Text("— — — — — — — — — — — — —",
                            fontSize = 12.sp, color = LucianosInk4, fontFamily = FontFamily.Monospace,
                            letterSpacing = 2.sp)
                        Spacer(Modifier.height(6.dp))
                        Text("Toca para firmar", fontSize = 12.sp, color = LucianosInk3,
                            fontFamily = FontFamily.SansSerif)
                    }
                }
            }

            Spacer(Modifier.height(8.dp))
        }

        Surface(shadowElevation = 8.dp, color = Color.White) {
            Button(
                onClick = {
                    if (ready) {
                        EntregaState.docLic = docLic; EntregaState.docIne = docIne
                        EntregaState.docDom = docDom; EntregaState.docTarj = docTarj
                        EntregaState.signed = signed
                        navController.navigate(Screen.EntregaStep2.withId(reservationId))
                    }
                },
                modifier = Modifier.fillMaxWidth().padding(16.dp),
                enabled = ready,
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

// ─── PASO 2 · Inspección + fotos ─────────────────────────────────────────────

@Composable
fun EntregaStep2Screen(reservationId: String, navController: NavController) {
    val fuelOpts = listOf("E", "1/4", "1/2", "3/4", "F")
    var fuelLevel by remember { mutableStateOf("3/4") }
    var kmText by remember { mutableStateOf("45,200") }
    var photoCount by remember { mutableStateOf(3) }
    var damageCount by remember { mutableStateOf(0) }
    val photoSlots = listOf("frente", "lat. izq", "lat. der", "trasera", "interior", "tablero")
    val ready = photoCount >= 3

    Column(modifier = Modifier.fillMaxSize().background(LucianosBackground)) {
        Surface(shadowElevation = 0.dp, color = Color.White, modifier = Modifier.fillMaxWidth()) {
            Column {
                FlowTopBar(
                    onBack = { navController.popBackStack() },
                    onCancel = { navController.navigate(Screen.Home.route) { popUpTo(Screen.Home.route) { inclusive = true } } }
                )
                EntregaHeader(step = 1)
            }
        }

        Column(
            modifier = Modifier.weight(1f).verticalScroll(rememberScrollState())
                .padding(horizontal = 16.dp, vertical = 16.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            // Tanque + km
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                Surface(modifier = Modifier.weight(1f), shape = RoundedCornerShape(14.dp),
                    color = Color.White, border = androidx.compose.foundation.BorderStroke(1.dp, LucianosHairline)) {
                    Column(modifier = Modifier.padding(12.dp)) {
                        SectionEyebrow(text = "Tanque")
                        Spacer(Modifier.height(8.dp))
                        Text(fuelLevel, fontSize = 24.sp, fontFamily = FontFamily.Serif,
                            color = LucianosPrimary, fontWeight = FontWeight.Normal)
                    }
                }
                Surface(modifier = Modifier.weight(1f), shape = RoundedCornerShape(14.dp),
                    color = Color.White, border = androidx.compose.foundation.BorderStroke(1.dp, LucianosHairline)) {
                    Column(modifier = Modifier.padding(12.dp)) {
                        SectionEyebrow(text = "Kilometraje")
                        Spacer(Modifier.height(8.dp))
                        Text(kmText, fontSize = 20.sp, fontFamily = FontFamily.Serif,
                            color = LucianosInk, fontWeight = FontWeight.Normal)
                        Text("km", fontSize = 11.sp, color = LucianosInk3, fontFamily = FontFamily.SansSerif)
                    }
                }
            }

            // Selector de tanque
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

            // Daños
            SectionEyebrow(text = "Daños existentes (toca para marcar)")
            Surface(
                modifier = Modifier.fillMaxWidth().clickable { damageCount++ },
                shape = RoundedCornerShape(14.dp), color = Color.White,
                border = androidx.compose.foundation.BorderStroke(1.dp, LucianosHairline)
            ) {
                Column(modifier = Modifier.padding(14.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                    // Car diagram (simplified)
                    Box(
                        modifier = Modifier.fillMaxWidth().height(80.dp)
                            .clip(RoundedCornerShape(8.dp)).background(LucianosPaperAlt),
                        contentAlignment = Alignment.Center
                    ) {
                        Text("🚗  Vista del vehículo  🚗", fontSize = 13.sp, color = LucianosInk3,
                            fontFamily = FontFamily.SansSerif)
                    }
                    Spacer(Modifier.height(8.dp))
                    Text(
                        if (damageCount == 0) "Sin daños marcados — toca para agregar"
                        else "$damageCount daño(s) marcado(s)",
                        fontSize = 11.sp, color = if (damageCount > 0) LucianosWarn else LucianosInk3,
                        fontFamily = FontFamily.SansSerif
                    )
                    if (damageCount > 0) {
                        TextButton(onClick = { damageCount = 0 }) {
                            Text("Limpiar", fontSize = 11.sp, color = LucianosInk2)
                        }
                    }
                }
            }

            // Fotos
            SectionEyebrow(text = "Fotos de entrega")
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Spacer(Modifier.width(0.dp))
                Text("$photoCount / ${photoSlots.size}", fontSize = 11.sp,
                    color = if (photoCount >= 3) LucianosPrimary else LucianosWarn,
                    fontWeight = FontWeight.SemiBold, fontFamily = FontFamily.SansSerif)
            }
            val rows = photoSlots.chunked(3)
            rows.forEach { row ->
                Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    row.forEach { slot ->
                        val idx = photoSlots.indexOf(slot)
                        val has = idx < photoCount
                        Surface(
                            modifier = Modifier.weight(1f).aspectRatio(1f).clickable {
                                if (!has) photoCount = idx + 1
                            },
                            shape = RoundedCornerShape(10.dp),
                            color = if (has) LucianosPaperAlt else Color.Transparent,
                            border = androidx.compose.foundation.BorderStroke(
                                if (has) 1.dp else 1.5.dp,
                                if (has) LucianosHairline else LucianosInk4
                            )
                        ) {
                            Box(contentAlignment = Alignment.Center) {
                                if (has) {
                                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                        Text("📷", fontSize = 20.sp)
                                        Text(slot, fontSize = 9.sp, color = LucianosInk3,
                                            fontFamily = FontFamily.SansSerif)
                                    }
                                } else {
                                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                        Text("+", fontSize = 18.sp, color = LucianosInk4)
                                        Text(slot, fontSize = 9.sp, color = LucianosInk4,
                                            fontFamily = FontFamily.SansSerif)
                                    }
                                }
                            }
                        }
                    }
                }
            }
            Spacer(Modifier.height(8.dp))
        }

        Surface(shadowElevation = 8.dp, color = Color.White) {
            Button(
                onClick = {
                    if (ready) {
                        EntregaState.fuelLevel = fuelLevel
                        EntregaState.kmStart = kmText.replace(",", "")
                        EntregaState.damageCount = damageCount
                        EntregaState.photoCount = photoCount
                        navController.navigate(Screen.EntregaStep3.withId(reservationId))
                    }
                },
                modifier = Modifier.fillMaxWidth().padding(16.dp),
                enabled = ready,
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

// ─── PASO 3 · Cobro ───────────────────────────────────────────────────────────

@Composable
fun EntregaStep3Screen(reservationId: String, navController: NavController) {
    val total = 4700
    val methods = listOf("cash" to "Efectivo", "card" to "Tarjeta", "tx" to "Transfer.", "mix" to "Mixto")
    var method by remember { mutableStateOf("cash") }
    var amountText by remember { mutableStateOf("5,000") }
    val amountNum = amountText.replace(",", "").toIntOrNull() ?: 0
    val change = amountNum - total

    Column(modifier = Modifier.fillMaxSize().background(LucianosBackground)) {
        Surface(shadowElevation = 0.dp, color = Color.White, modifier = Modifier.fillMaxWidth()) {
            Column {
                FlowTopBar(
                    onBack = { navController.popBackStack() },
                    onCancel = { navController.navigate(Screen.Home.route) { popUpTo(Screen.Home.route) { inclusive = true } } }
                )
                EntregaHeader(step = 2)
            }
        }

        Column(
            modifier = Modifier.weight(1f).verticalScroll(rememberScrollState())
                .padding(horizontal = 16.dp, vertical = 16.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            // Amount card (dark)
            Surface(
                modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(18.dp),
                color = LucianosPrimary
            ) {
                Column(modifier = Modifier.padding(18.dp)) {
                    Text("A COBRAR AHORA", fontSize = 10.sp, fontWeight = FontWeight.SemiBold,
                        letterSpacing = 1.sp, color = Color.White.copy(alpha = 0.7f),
                        fontFamily = FontFamily.SansSerif)
                    Spacer(Modifier.height(4.dp))
                    Row(verticalAlignment = Alignment.Bottom) {
                        Text("\$$total", fontSize = 42.sp, fontFamily = FontFamily.Serif,
                            fontWeight = FontWeight.Normal, color = Color.White, letterSpacing = (-1).sp,
                            lineHeight = 44.sp)
                    }
                    Spacer(Modifier.height(6.dp))
                    Text("\$2,400 renta · \$300 seguro · \$2,000 depósito",
                        fontSize = 11.sp, color = Color.White.copy(alpha = 0.7f),
                        fontFamily = FontFamily.SansSerif)
                }
            }

            // Método de pago
            SectionEyebrow(text = "Método de pago")
            Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                methods.forEach { (id, label) ->
                    val sel = id == method
                    Surface(
                        modifier = Modifier.weight(1f).clickable { method = id },
                        shape = RoundedCornerShape(12.dp),
                        color = if (sel) LucianosPrimarySoft else Color.White,
                        border = androidx.compose.foundation.BorderStroke(
                            if (sel) 1.5.dp else 1.dp,
                            if (sel) LucianosPrimary else LucianosHairline
                        )
                    ) {
                        Box(contentAlignment = Alignment.Center,
                            modifier = Modifier.padding(vertical = 12.dp)) {
                            Text(label, fontSize = 11.sp, fontWeight = FontWeight.SemiBold,
                                color = if (sel) LucianosPrimary else LucianosInk,
                                fontFamily = FontFamily.SansSerif)
                        }
                    }
                }
            }

            // Efectivo: monto recibido
            if (method == "cash") {
                Surface(modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(14.dp),
                    color = Color.White, border = androidx.compose.foundation.BorderStroke(1.dp, LucianosHairline)) {
                    Column(modifier = Modifier.padding(14.dp)) {
                        SectionEyebrow(text = "Recibido")
                        Spacer(Modifier.height(6.dp))
                        OutlinedTextField(
                            value = amountText,
                            onValueChange = { amountText = it.filter { c -> c.isDigit() || c == ',' } },
                            modifier = Modifier.fillMaxWidth(),
                            prefix = { Text("\$", fontSize = 22.sp, fontFamily = FontFamily.Serif) },
                            textStyle = androidx.compose.ui.text.TextStyle(
                                fontSize = 24.sp, fontFamily = FontFamily.Serif,
                                color = LucianosInk
                            ),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = LucianosPrimary,
                                unfocusedBorderColor = LucianosHairline
                            ),
                            singleLine = true
                        )
                        Spacer(Modifier.height(10.dp))
                        Row(modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween) {
                            Text("Cambio", fontSize = 13.sp, color = LucianosInk2,
                                fontFamily = FontFamily.SansSerif)
                            Text("\$$change", fontSize = 16.sp, fontWeight = FontWeight.SemiBold,
                                fontFamily = FontFamily.Monospace,
                                color = if (change >= 0) LucianosPrimary else LucianosDanger)
                        }
                    }
                }
            }

            // Recibo WhatsApp
            Surface(modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(14.dp),
                color = Color.White, border = androidx.compose.foundation.BorderStroke(1.dp, LucianosHairline)) {
                Row(modifier = Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier.size(22.dp).clip(RoundedCornerShape(6.dp))
                            .background(LucianosPrimary), contentAlignment = Alignment.Center
                    ) {
                        Icon(Icons.Filled.Check, contentDescription = null,
                            tint = Color.White, modifier = Modifier.size(14.dp))
                    }
                    Spacer(Modifier.width(10.dp))
                    Text("Enviar recibo por WhatsApp al cliente",
                        fontSize = 12.sp, fontFamily = FontFamily.SansSerif, color = LucianosInk)
                }
            }

            Spacer(Modifier.height(8.dp))
        }

        Surface(shadowElevation = 8.dp, color = Color.White) {
            Button(
                onClick = {
                    EntregaState.paymentMethod = method
                    EntregaState.amountReceived = amountText
                    navController.navigate(Screen.EntregaOk.withId(reservationId)) {
                        popUpTo(Screen.Reservations.route)
                    }
                },
                modifier = Modifier.fillMaxWidth().padding(16.dp),
                shape = RoundedCornerShape(999.dp),
                colors = ButtonDefaults.buttonColors(containerColor = LucianosPrimary)
            ) {
                Text("Cobrar y entregar auto", fontSize = 15.sp, fontWeight = FontWeight.SemiBold,
                    fontFamily = FontFamily.SansSerif, modifier = Modifier.padding(vertical = 4.dp))
            }
        }
    }
}

// ─── SUCCESS ──────────────────────────────────────────────────────────────────

@Composable
fun EntregaOkScreen(reservationId: String, navController: NavController) {
    val all = todayReservations + tomorrowReservations
    val res = all.find { it.id == reservationId } ?: all.first()
    val firstName = res.clientName.split(" ").firstOrNull() ?: "cliente"

    Box(
        modifier = Modifier.fillMaxSize().background(LucianosPrimaryDeep)
    ) {
        // Decorative circle
        Box(
            modifier = Modifier.offset(x = 100.dp, y = (-120).dp).size(320.dp).clip(CircleShape)
                .background(LucianosPrimary.copy(alpha = 0.4f))
        )

        Column(
            modifier = Modifier.fillMaxSize().statusBarsPadding()
                .padding(horizontal = 28.dp).padding(top = 60.dp, bottom = 32.dp),
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            Column(verticalArrangement = Arrangement.spacedBy(18.dp)) {
                Box(
                    modifier = Modifier.size(72.dp).clip(CircleShape).background(LucianosPrimary),
                    contentAlignment = Alignment.Center
                ) {
                    Text("🔑", fontSize = 32.sp)
                }

                Column {
                    Text("ENTREGA COMPLETADA", fontSize = 11.sp, fontWeight = FontWeight.SemiBold,
                        letterSpacing = 1.5.sp, color = Color.White.copy(alpha = 0.6f),
                        fontFamily = FontFamily.SansSerif)
                    Spacer(Modifier.height(6.dp))
                    Text("¡Auto entregado!\n¡Buen viaje, $firstName!", fontSize = 34.sp,
                        fontFamily = FontFamily.Serif, fontWeight = FontWeight.Normal,
                        color = Color.White, lineHeight = 38.sp)
                }

                Surface(
                    shape = RoundedCornerShape(16.dp),
                    color = Color.White.copy(alpha = 0.08f),
                    border = androidx.compose.foundation.BorderStroke(1.dp, Color.White.copy(alpha = 0.15f)),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(
                        modifier = Modifier.padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        SummaryRow("Cobrado", "\$4,700", Color.White)
                        SummaryRow("Devuelve", "Vie 24 may · 18:00", Color.White)
                        SummaryRow("Recordatorio", "1 día antes", Color.White)
                    }
                }
            }

            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Button(
                    onClick = { navController.navigate(Screen.Home.route) { popUpTo(0) { inclusive = true } } },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(999.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = Color.White)
                ) {
                    Text("Volver al inicio", fontSize = 14.sp, fontWeight = FontWeight.SemiBold,
                        color = LucianosInk, modifier = Modifier.padding(vertical = 4.dp))
                }
                OutlinedButton(
                    onClick = { /* WhatsApp */ },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(999.dp),
                    colors = ButtonDefaults.outlinedButtonColors(contentColor = Color.White),
                    border = androidx.compose.foundation.BorderStroke(1.dp, Color.White.copy(alpha = 0.3f))
                ) {
                    Text("💬  Reenviar recibo", fontSize = 14.sp, fontWeight = FontWeight.SemiBold,
                        modifier = Modifier.padding(vertical = 4.dp))
                }
            }
        }
    }
}

@Composable
private fun SummaryRow(label: String, value: String, textColor: Color) {
    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
        Text(label, fontSize = 12.sp, color = textColor.copy(alpha = 0.65f),
            fontFamily = FontFamily.SansSerif)
        Text(value, fontSize = 12.sp, color = textColor, fontFamily = FontFamily.SansSerif,
            fontWeight = FontWeight.Medium)
    }
}
