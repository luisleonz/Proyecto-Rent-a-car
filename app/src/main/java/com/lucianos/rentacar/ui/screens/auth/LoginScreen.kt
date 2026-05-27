package com.lucianos.rentacar.ui.screens.auth

import androidx.compose.foundation.background
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
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.DirectionsCar
import androidx.compose.material.icons.filled.Email
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
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
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.lucianos.rentacar.data.AuthState
import com.lucianos.rentacar.data.sampleUsers
import com.lucianos.rentacar.ui.theme.LucianosDanger
import com.lucianos.rentacar.ui.theme.LucianosInk
import com.lucianos.rentacar.ui.theme.LucianosInk2
import com.lucianos.rentacar.ui.theme.LucianosInk3
import com.lucianos.rentacar.ui.theme.LucianosPrimary
import com.lucianos.rentacar.ui.theme.LucianosPrimaryDeep
import com.lucianos.rentacar.ui.theme.LucianosPrimarySoft

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LoginScreen(
    onUserWithPassword: (email: String) -> Unit,
    onNewUser: (email: String) -> Unit
) {
    var email by remember { mutableStateOf("") }
    var error by remember { mutableStateOf<String?>(null) }

    fun onContinue() {
        val trimmed = email.trim().lowercase()
        if (trimmed.isEmpty()) {
            error = "Ingresa tu correo electrónico"
            return
        }
        val user = sampleUsers.find { it.email == trimmed }
        if (user == null) {
            error = "No encontramos una cuenta con ese correo"
        } else {
            error = null
            AuthState.setUser(user)
            if (user.hasPassword) {
                onUserWithPassword(trimmed)
            } else {
                onNewUser(trimmed)
            }
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.White)
            .statusBarsPadding()
            .verticalScroll(rememberScrollState())
            .padding(24.dp)
    ) {
        Spacer(modifier = Modifier.height(32.dp))

        // Logo
        Row(verticalAlignment = Alignment.CenterVertically) {
            androidx.compose.foundation.layout.Box(
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
                fontSize = 22.sp,
                fontWeight = FontWeight.Bold,
                fontFamily = FontFamily.Serif,
                color = LucianosInk
            )
        }

        Spacer(modifier = Modifier.height(52.dp))

        Text(
            text = "Iniciar sesión",
            fontSize = 28.sp,
            fontWeight = FontWeight.Bold,
            fontFamily = FontFamily.Serif,
            color = LucianosInk
        )
        Spacer(modifier = Modifier.height(6.dp))
        Text(
            text = "Ingresa el correo con el que tu administrador te registró.",
            fontSize = 14.sp,
            color = LucianosInk2,
            fontFamily = FontFamily.SansSerif,
            lineHeight = 20.sp
        )

        Spacer(modifier = Modifier.height(32.dp))

        OutlinedTextField(
            value = email,
            onValueChange = {
                email = it
                error = null
            },
            label = { Text("Correo electrónico") },
            leadingIcon = {
                Icon(
                    Icons.Filled.Email,
                    contentDescription = null,
                    tint = if (error != null) LucianosDanger else LucianosInk3
                )
            },
            modifier = Modifier.fillMaxWidth(),
            keyboardOptions = KeyboardOptions(
                keyboardType = KeyboardType.Email,
                imeAction = ImeAction.Done
            ),
            keyboardActions = KeyboardActions(onDone = { onContinue() }),
            isError = error != null,
            supportingText = if (error != null) {
                { Text(error!!, color = LucianosDanger, fontSize = 12.sp) }
            } else null,
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = LucianosPrimary,
                focusedLabelColor = LucianosPrimary,
                errorBorderColor = LucianosDanger,
                errorLabelColor = LucianosDanger,
            ),
            singleLine = true
        )

        Spacer(modifier = Modifier.height(24.dp))

        Button(
            onClick = { onContinue() },
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

        Spacer(modifier = Modifier.height(32.dp))

        // Demo hint card
        Surface(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(14.dp),
            color = LucianosPrimarySoft
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text(
                    text = "Cuentas de prueba",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = LucianosPrimaryDeep,
                    fontFamily = FontFamily.SansSerif
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "luciano@lucianos.com",
                    fontSize = 12.sp,
                    color = LucianosInk2,
                    fontFamily = FontFamily.Monospace
                )
                Text(
                    text = "  → tiene contraseña (usa cualquier contraseña de 6+ caracteres)",
                    fontSize = 11.sp,
                    color = LucianosInk3,
                    fontFamily = FontFamily.SansSerif,
                    lineHeight = 16.sp
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "esteban@lucianos.com",
                    fontSize = 12.sp,
                    color = LucianosInk2,
                    fontFamily = FontFamily.Monospace
                )
                Text(
                    text = "  → primer ingreso, creará su contraseña",
                    fontSize = 11.sp,
                    color = LucianosInk3,
                    fontFamily = FontFamily.SansSerif
                )
            }
        }
    }
}
