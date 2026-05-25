package com.lucianos.rentacar

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import com.lucianos.rentacar.navigation.MainApp
import com.lucianos.rentacar.ui.theme.LucianosRentaCarTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            LucianosRentaCarTheme {
                MainApp()
            }
        }
    }
}
