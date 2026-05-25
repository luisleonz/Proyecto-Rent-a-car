package com.lucianos.rentacar.ui.screens.payments

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
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.CreditCard
import androidx.compose.material.icons.filled.Money
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Divider
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
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.lucianos.rentacar.ui.components.SectionEyebrow
import com.lucianos.rentacar.ui.theme.LucianosBackground
import com.lucianos.rentacar.ui.theme.LucianosHairline
import com.lucianos.rentacar.ui.theme.LucianosInk
import com.lucianos.rentacar.ui.theme.LucianosInk2
import com.lucianos.rentacar.ui.theme.LucianosInk3
import com.lucianos.rentacar.ui.theme.LucianosPrimary
import com.lucianos.rentacar.ui.theme.LucianosPrimarySoft
import com.lucianos.rentacar.ui.theme.MonoAmount

@Composable
fun PaymentScreen(
    reservationId: String = "1",
    onBack: () -> Unit = {},
    onComplete: () -> Unit = {}
) {
    var selectedMethod by remember { mutableStateOf("Efectivo") }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(LucianosBackground)
    ) {
        // AppBar
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
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = "Cobro · Reserva #$reservationId",
                    fontSize = 17.sp,
                    fontWeight = FontWeight.SemiBold,
                    fontFamily = FontFamily.SansSerif,
                    color = LucianosInk
                )
                Text(
                    text = "Mariana Pérez · Sentra ABC-123",
                    fontSize = 12.sp,
                    color = LucianosInk3,
                    fontFamily = FontFamily.SansSerif
                )
            }
        }

        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 16.dp)
        ) {
            Spacer(modifier = Modifier.height(20.dp))

            // Amount card
            Surface(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(20.dp),
                color = Color(0xFF1E1E26)
            ) {
                Column(
                    modifier = Modifier.padding(20.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    SectionEyebrow(
                        text = "Total a cobrar",
                        color = Color.White.copy(alpha = 0.55f)
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "\$2,040",
                        style = MonoAmount,
                        color = Color.White
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "3 días · \$680/día",
                        fontSize = 13.sp,
                        color = Color.White.copy(alpha = 0.55f),
                        fontFamily = FontFamily.SansSerif
                    )
                }
            }

            Spacer(modifier = Modifier.height(20.dp))

            // Payment breakdown
            Surface(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                color = Color.White,
                shadowElevation = 0.dp,
                border = androidx.compose.foundation.BorderStroke(1.dp, LucianosHairline)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = "Desglose",
                        fontSize = 14.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = LucianosInk,
                        fontFamily = FontFamily.SansSerif
                    )
                    Spacer(modifier = Modifier.height(12.dp))

                    PaymentLineItem("Renta (3 días × \$680)", "\$2,040")
                    Divider(color = LucianosHairline, modifier = Modifier.padding(vertical = 8.dp))
                    PaymentLineItem("Seguro incluido", "\$0")
                    Divider(color = LucianosHairline, modifier = Modifier.padding(vertical = 8.dp))
                    PaymentLineItem("Depósito retenido", "–\$1,500")
                    Divider(color = LucianosHairline, modifier = Modifier.padding(vertical = 8.dp))
                    PaymentLineItem(
                        label = "Total a cobrar",
                        amount = "\$2,040",
                        isTotal = true
                    )
                }
            }

            Spacer(modifier = Modifier.height(20.dp))

            // Payment method
            Text(
                text = "Método de pago",
                fontSize = 14.sp,
                fontWeight = FontWeight.SemiBold,
                color = LucianosInk,
                fontFamily = FontFamily.SansSerif
            )

            Spacer(modifier = Modifier.height(10.dp))

            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                PaymentMethodCard(
                    icon = Icons.Filled.Money,
                    label = "Efectivo",
                    isSelected = selectedMethod == "Efectivo",
                    modifier = Modifier.weight(1f),
                    onClick = { selectedMethod = "Efectivo" }
                )
                PaymentMethodCard(
                    icon = Icons.Filled.CreditCard,
                    label = "Tarjeta",
                    isSelected = selectedMethod == "Tarjeta",
                    modifier = Modifier.weight(1f),
                    onClick = { selectedMethod = "Tarjeta" }
                )
            }

            Spacer(modifier = Modifier.height(24.dp))

            Button(
                onClick = onComplete,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(52.dp),
                shape = RoundedCornerShape(14.dp),
                colors = ButtonDefaults.buttonColors(containerColor = LucianosPrimary)
            ) {
                Icon(
                    Icons.Filled.CheckCircle,
                    contentDescription = null,
                    modifier = Modifier.size(20.dp)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = "Confirmar cobro",
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
private fun PaymentLineItem(
    label: String,
    amount: String,
    isTotal: Boolean = false
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(
            text = label,
            fontSize = if (isTotal) 15.sp else 13.sp,
            fontWeight = if (isTotal) FontWeight.SemiBold else FontWeight.Normal,
            color = if (isTotal) LucianosInk else LucianosInk2,
            fontFamily = FontFamily.SansSerif
        )
        Text(
            text = amount,
            fontSize = if (isTotal) 15.sp else 13.sp,
            fontWeight = if (isTotal) FontWeight.Bold else FontWeight.Normal,
            color = if (isTotal) LucianosPrimary else LucianosInk2,
            fontFamily = FontFamily.Monospace
        )
    }
}

@Composable
private fun PaymentMethodCard(
    icon: ImageVector,
    label: String,
    isSelected: Boolean,
    modifier: Modifier = Modifier,
    onClick: () -> Unit
) {
    Surface(
        modifier = modifier,
        shape = RoundedCornerShape(12.dp),
        color = if (isSelected) LucianosPrimarySoft else Color.White,
        shadowElevation = 0.dp,
        border = androidx.compose.foundation.BorderStroke(
            width = if (isSelected) 2.dp else 1.dp,
            color = if (isSelected) LucianosPrimary else LucianosHairline
        ),
        onClick = onClick
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = if (isSelected) LucianosPrimary else LucianosInk3,
                modifier = Modifier.size(28.dp)
            )
            Spacer(modifier = Modifier.height(6.dp))
            Text(
                text = label,
                fontSize = 13.sp,
                fontWeight = if (isSelected) FontWeight.SemiBold else FontWeight.Normal,
                color = if (isSelected) LucianosPrimary else LucianosInk2,
                fontFamily = FontFamily.SansSerif
            )
        }
    }
}
