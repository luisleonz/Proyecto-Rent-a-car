package com.lucianos.rentacar.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.lucianos.rentacar.ui.theme.LucianosDanger
import com.lucianos.rentacar.ui.theme.LucianosDangerSoft
import com.lucianos.rentacar.ui.theme.LucianosInk
import com.lucianos.rentacar.ui.theme.LucianosInk2
import com.lucianos.rentacar.ui.theme.LucianosInk3
import com.lucianos.rentacar.ui.theme.LucianosInk4
import com.lucianos.rentacar.ui.theme.LucianosPrimary
import com.lucianos.rentacar.ui.theme.LucianosPrimarySoft
import com.lucianos.rentacar.ui.theme.LucianosWarn
import com.lucianos.rentacar.ui.theme.LucianosWarnSoft
import com.lucianos.rentacar.ui.theme.MonoTime

// Avatar circle with initials
@Composable
fun AvatarCircle(
    initials: String,
    accent: Color = LucianosPrimary,
    size: Dp = 40.dp,
    textColor: Color = Color.White
) {
    Box(
        modifier = Modifier
            .size(size)
            .clip(CircleShape)
            .background(accent),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = initials,
            color = textColor,
            fontSize = (size.value * 0.35f).sp,
            fontWeight = FontWeight.SemiBold,
            fontFamily = FontFamily.SansSerif
        )
    }
}

// Status chip for vehicle or reservation status
@Composable
fun StatusChip(
    status: String,
    customText: String? = null
) {
    val (bgColor, textColor, label) = when (status.lowercase()) {
        "rentado" -> Triple(LucianosPrimarySoft, LucianosPrimary, customText ?: "Rentado")
        "disponible" -> Triple(Color(0xFFEEEEF2), LucianosInk2, customText ?: "Disponible")
        "taller" -> Triple(LucianosWarnSoft, LucianosWarn, customText ?: "Taller")
        "reservado" -> Triple(Color(0xFFEEEEFF), Color(0xFF4444AA), customText ?: "Reservado")
        "urgent" -> Triple(LucianosDangerSoft, LucianosDanger, customText ?: "Urgente")
        "entrega" -> Triple(LucianosPrimarySoft, LucianosPrimary, customText ?: "Entrega")
        "devolución" -> Triple(Color(0xFFEEEEF2), LucianosInk2, customText ?: "Devolución")
        else -> Triple(Color(0xFFEEEEF2), LucianosInk3, customText ?: status)
    }

    Box(
        modifier = Modifier
            .clip(RoundedCornerShape(6.dp))
            .background(bgColor)
            .padding(horizontal = 8.dp, vertical = 3.dp)
    ) {
        Text(
            text = label,
            color = textColor,
            fontSize = 11.sp,
            fontWeight = FontWeight.SemiBold,
            fontFamily = FontFamily.SansSerif
        )
    }
}

// Section eyebrow label
@Composable
fun SectionEyebrow(
    text: String,
    modifier: Modifier = Modifier,
    color: Color = LucianosInk3
) {
    Text(
        text = text.uppercase(),
        color = color,
        fontSize = 11.sp,
        fontWeight = FontWeight.SemiBold,
        fontFamily = FontFamily.SansSerif,
        letterSpacing = 1.sp,
        modifier = modifier
    )
}

// Dark background hero card
@Composable
fun DarkHeroCard(
    modifier: Modifier = Modifier,
    content: @Composable () -> Unit
) {
    Surface(
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(20.dp),
        color = Color(0xFF1E1E26),
        shadowElevation = 4.dp
    ) {
        Column(modifier = Modifier.padding(20.dp)) {
            content()
        }
    }
}

// Timeline item for reservation list
@Composable
fun TimelineItem(
    time: String,
    clientName: String,
    vehicle: String,
    type: String,
    initials: String,
    isUrgent: Boolean = false,
    onClick: () -> Unit = {},
    modifier: Modifier = Modifier
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .clickable { onClick() }
            .padding(vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        // Time column
        Text(
            text = time,
            style = MonoTime,
            color = if (isUrgent) LucianosDanger else LucianosInk3,
            modifier = Modifier.width(52.dp)
        )

        Spacer(modifier = Modifier.width(10.dp))

        // Avatar
        AvatarCircle(
            initials = initials,
            accent = if (isUrgent) LucianosDanger else LucianosPrimary,
            size = 36.dp
        )

        Spacer(modifier = Modifier.width(10.dp))

        // Info
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = clientName,
                color = LucianosInk,
                fontSize = 14.sp,
                fontWeight = FontWeight.SemiBold,
                fontFamily = FontFamily.SansSerif,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
            Text(
                text = vehicle,
                color = LucianosInk3,
                fontSize = 12.sp,
                fontFamily = FontFamily.SansSerif,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
        }

        Spacer(modifier = Modifier.width(8.dp))

        // Type chip
        StatusChip(status = type.lowercase())
    }
}

// Vehicle list item row
@Composable
fun VehicleListItem(
    plate: String,
    model: String,
    color: String,
    km: String,
    status: String,
    clientInfo: String? = null,
    modifier: Modifier = Modifier
) {
    val barColor = when (status.lowercase()) {
        "rentado" -> LucianosPrimary
        "taller" -> LucianosWarn
        "reservado" -> Color(0xFF4444AA)
        else -> LucianosInk4
    }

    Row(
        modifier = modifier
            .fillMaxWidth()
            .padding(vertical = 10.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        // Status bar on left
        Box(
            modifier = Modifier
                .width(4.dp)
                .height(44.dp)
                .clip(RoundedCornerShape(2.dp))
                .background(barColor)
        )

        Spacer(modifier = Modifier.width(12.dp))

        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = model,
                color = LucianosInk,
                fontSize = 14.sp,
                fontWeight = FontWeight.SemiBold,
                fontFamily = FontFamily.SansSerif
            )
            Row(
                horizontalArrangement = Arrangement.spacedBy(6.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = plate,
                    color = LucianosInk3,
                    fontSize = 12.sp,
                    fontFamily = FontFamily.Monospace,
                    fontWeight = FontWeight.Medium
                )
                Text(
                    text = "·",
                    color = LucianosInk4,
                    fontSize = 12.sp
                )
                Text(
                    text = color,
                    color = LucianosInk3,
                    fontSize = 12.sp,
                    fontFamily = FontFamily.SansSerif
                )
                Text(
                    text = "·",
                    color = LucianosInk4,
                    fontSize = 12.sp
                )
                Text(
                    text = "$km km",
                    color = LucianosInk3,
                    fontSize = 12.sp,
                    fontFamily = FontFamily.Monospace
                )
            }
            if (clientInfo != null) {
                Text(
                    text = clientInfo,
                    color = LucianosInk3,
                    fontSize = 11.sp,
                    fontFamily = FontFamily.SansSerif
                )
            }
        }

        StatusChip(status = status)
    }
}
