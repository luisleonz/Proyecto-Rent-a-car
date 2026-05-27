package com.lucianos.rentacar.ui.screens.auth

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material.icons.filled.VisibilityOff
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.lucianos.rentacar.data.AuthState
import com.lucianos.rentacar.data.sampleUsers
import com.lucianos.rentacar.ui.components.AvatarCircle
import com.lucianos.rentacar.ui.theme.LucianosDanger
import com.lucianos.rentacar.ui.theme.LucianosInk
import com.lucianos.rentacar.ui.theme.LucianosInk2
import com.lucianos.rentacar.ui.theme.LucianosInk3
import com.lucianos.rentacar.ui.theme.LucianosPrimary

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun EnterPasswordScreen(
    email: String,
    onSuccess: () -> Unit,
    onBack: () -> Unit
) {
    val user = sampleUsers.find { it.email == email }
    var password by remember { mutableStateOf("") }
    var showPassword by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }

    fun onLogin() {
        if (password.length < 6) {
            error = "Contraseña incorrecta"
        } else {
            onSuccess()
        }
    }

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
        }

        Column(modifier = Modifier.padding(horizontal = 24.dp)) {
            AvatarCircle(
                initials = user?.initials ?: "?",
                size = 60.dp
            )

            Spacer(modifier = Modifier.height(16.dp))

            Text(
                text = "Hola, ${user?.firstName ?: ""}",
                fontSize = 26.sp,
                fontWeight = FontWeight.Bold,
                fontFamily = FontFamily.Serif,
                color = LucianosInk
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = email,
                fontSize = 14.sp,
                color = LucianosInk3,
                fontFamily = FontFamily.SansSerif
            )

            Spacer(modifier = Modifier.height(32.dp))

            OutlinedTextField(
                value = password,
                onValueChange = {
                    password = it
                    error = null
                },
                label = { Text("Contraseña") },
                leadingIcon = {
                    Icon(Icons.Filled.Lock, contentDescription = null, tint = LucianosInk3)
                },
                trailingIcon = {
                    IconButton(onClick = { showPassword = !showPassword }) {
                        Icon(
                            if (showPassword) Icons.Filled.VisibilityOff else Icons.Filled.Visibility,
                            contentDescription = null,
                            tint = LucianosInk3
                        )
                    }
                },
                modifier = Modifier.fillMaxWidth(),
                visualTransformation = if (showPassword) VisualTransformation.None else PasswordVisualTransformation(),
                keyboardOptions = KeyboardOptions(
                    keyboardType = KeyboardType.Password,
                    imeAction = ImeAction.Done
                ),
                keyboardActions = KeyboardActions(onDone = { onLogin() }),
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
                onClick = { onLogin() },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(52.dp),
                shape = RoundedCornerShape(14.dp),
                colors = ButtonDefaults.buttonColors(containerColor = LucianosPrimary)
            ) {
                Text(
                    text = "Iniciar sesión",
                    fontWeight = FontWeight.SemiBold,
                    fontSize = 16.sp,
                    fontFamily = FontFamily.SansSerif
                )
            }

            Spacer(modifier = Modifier.height(12.dp))

            TextButton(
                onClick = { },
                modifier = Modifier.fillMaxWidth()
            ) {
                Text(
                    text = "¿Olvidaste tu contraseña? Contacta al administrador",
                    color = LucianosInk2,
                    fontSize = 13.sp,
                    fontFamily = FontFamily.SansSerif
                )
            }
        }
    }
}
