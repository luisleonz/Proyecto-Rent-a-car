package com.lucianos.rentacar.ui.theme

import androidx.compose.material3.lightColorScheme
import androidx.compose.ui.graphics.Color

// Brand greens
val LucianosPrimary = Color(0xFF2D8A56)
val LucianosPrimaryDark = Color(0xFF1F6B40)
val LucianosPrimaryDeep = Color(0xFF1A5231)
val LucianosPrimarySoft = Color(0xFFE8F5EE)
val LucianosPrimaryLine = Color(0xFFB8DFC8)
val LucianosPrimaryContainer = Color(0xFFD0F0E0)

// Backgrounds
val LucianosBackground = Color(0xFFFAFAF7)
val LucianosPaperAlt = Color(0xFFF2F1EC)
val LucianosCard = Color(0xFFFFFFFF)
val LucianosHairline = Color(0xFFEAEAE4)

// Ink / text
val LucianosInk = Color(0xFF1E1E26)
val LucianosInk2 = Color(0xFF585868)
val LucianosInk3 = Color(0xFF838390)
val LucianosInk4 = Color(0xFFBCBCC4)

// States
val LucianosWarn = Color(0xFFC98A20)
val LucianosWarnSoft = Color(0xFFFEF8EC)
val LucianosDanger = Color(0xFFC04040)
val LucianosDangerSoft = Color(0xFFFEEEEE)

// Neutrals
val White = Color(0xFFFFFFFF)
val Black = Color(0xFF000000)

// Dark card background
val LucianosDarkCard = Color(0xFF1E1E26)
val LucianosDarkCard2 = Color(0xFF272730)

// Material 3 Light Color Scheme
val LucianosLightColorScheme = lightColorScheme(
    primary = LucianosPrimary,
    onPrimary = White,
    primaryContainer = LucianosPrimaryContainer,
    onPrimaryContainer = LucianosPrimaryDeep,
    secondary = LucianosPrimaryDark,
    onSecondary = White,
    secondaryContainer = LucianosPrimarySoft,
    onSecondaryContainer = LucianosPrimaryDeep,
    tertiary = LucianosWarn,
    onTertiary = White,
    tertiaryContainer = LucianosWarnSoft,
    onTertiaryContainer = Color(0xFF4A2F00),
    error = LucianosDanger,
    onError = White,
    errorContainer = LucianosDangerSoft,
    onErrorContainer = Color(0xFF4A0000),
    background = LucianosBackground,
    onBackground = LucianosInk,
    surface = LucianosCard,
    onSurface = LucianosInk,
    surfaceVariant = LucianosPaperAlt,
    onSurfaceVariant = LucianosInk2,
    outline = LucianosHairline,
    outlineVariant = LucianosPrimaryLine,
    inverseSurface = LucianosDarkCard,
    inverseOnSurface = White,
    inversePrimary = LucianosPrimarySoft,
)
