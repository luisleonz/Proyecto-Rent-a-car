package com.lucianos.rentacar.navigation

import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CalendarMonth
import androidx.compose.material.icons.filled.DirectionsCar
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.MoreHoriz
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.lucianos.rentacar.ui.screens.home.HomeScreen
import com.lucianos.rentacar.ui.screens.more.MoreScreen
import com.lucianos.rentacar.ui.screens.onboarding.OnboardingDoneScreen
import com.lucianos.rentacar.ui.screens.onboarding.OnboardingPasswordScreen
import com.lucianos.rentacar.ui.screens.onboarding.OnboardingPermissionsScreen
import com.lucianos.rentacar.ui.screens.onboarding.OnboardingTourScreen
import com.lucianos.rentacar.ui.screens.onboarding.OnboardingWelcomeScreen
import com.lucianos.rentacar.ui.screens.reservations.ReservationsScreen
import com.lucianos.rentacar.ui.screens.vehicles.VehicleDetailScreen
import com.lucianos.rentacar.ui.screens.vehicles.VehiclesScreen
import com.lucianos.rentacar.ui.theme.LucianosInk3
import com.lucianos.rentacar.ui.theme.LucianosPrimary
import com.lucianos.rentacar.ui.theme.LucianosPrimarySoft

sealed class Screen(val route: String) {
    object Onboarding : Screen("onboarding")
    object OnboardingPassword : Screen("onboarding_password")
    object OnboardingPermissions : Screen("onboarding_permissions")
    object OnboardingTour : Screen("onboarding_tour")
    object OnboardingDone : Screen("onboarding_done")
    object Home : Screen("home")
    object Reservations : Screen("reservations")
    object Vehicles : Screen("vehicles")
    object VehicleDetail : Screen("vehicle_detail/{plate}") {
        fun withPlate(plate: String) = "vehicle_detail/$plate"
    }
    object More : Screen("more")
}

data class BottomNavItem(
    val label: String,
    val icon: ImageVector,
    val screen: Screen
)

val bottomNavItems = listOf(
    BottomNavItem("Panel", Icons.Filled.Home, Screen.Home),
    BottomNavItem("Reservas", Icons.Filled.CalendarMonth, Screen.Reservations),
    BottomNavItem("Vehículos", Icons.Filled.DirectionsCar, Screen.Vehicles),
    BottomNavItem("Más", Icons.Filled.MoreHoriz, Screen.More),
)

val mainScreenRoutes = setOf(
    Screen.Home.route,
    Screen.Reservations.route,
    Screen.Vehicles.route,
    Screen.More.route,
)

@Composable
fun MainApp() {
    val navController = rememberNavController()
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route

    val showBottomBar = currentRoute in mainScreenRoutes

    Scaffold(
        bottomBar = {
            if (showBottomBar) {
                LucianosBottomNavBar(navController = navController, currentRoute = currentRoute)
            }
        }
    ) { innerPadding ->
        NavHost(
            navController = navController,
            startDestination = Screen.Onboarding.route,
            modifier = Modifier.padding(innerPadding)
        ) {
            composable(Screen.Onboarding.route) {
                OnboardingWelcomeScreen(
                    onContinue = { navController.navigate(Screen.OnboardingPassword.route) }
                )
            }
            composable(Screen.OnboardingPassword.route) {
                OnboardingPasswordScreen(
                    onContinue = { navController.navigate(Screen.OnboardingPermissions.route) },
                    onBack = { navController.popBackStack() }
                )
            }
            composable(Screen.OnboardingPermissions.route) {
                OnboardingPermissionsScreen(
                    onContinue = { navController.navigate(Screen.OnboardingTour.route) },
                    onBack = { navController.popBackStack() }
                )
            }
            composable(Screen.OnboardingTour.route) {
                OnboardingTourScreen(
                    onContinue = { navController.navigate(Screen.OnboardingDone.route) },
                    onSkip = { navController.navigate(Screen.OnboardingDone.route) },
                    onBack = { navController.popBackStack() }
                )
            }
            composable(Screen.OnboardingDone.route) {
                OnboardingDoneScreen(
                    onEnterPanel = {
                        navController.navigate(Screen.Home.route) {
                            popUpTo(Screen.Onboarding.route) { inclusive = true }
                        }
                    }
                )
            }
            composable(Screen.Home.route) {
                HomeScreen(navController = navController)
            }
            composable(Screen.Reservations.route) {
                ReservationsScreen(navController = navController)
            }
            composable(Screen.Vehicles.route) {
                VehiclesScreen(navController = navController)
            }
            composable(
                route = Screen.VehicleDetail.route,
                arguments = listOf(navArgument("plate") { type = NavType.StringType })
            ) { backStackEntry ->
                val plate = backStackEntry.arguments?.getString("plate") ?: ""
                VehicleDetailScreen(plate = plate, onBack = { navController.popBackStack() })
            }
            composable(Screen.More.route) {
                MoreScreen(navController = navController)
            }
        }
    }
}

@Composable
fun LucianosBottomNavBar(navController: NavHostController, currentRoute: String?) {
    NavigationBar(
        containerColor = Color.White,
        tonalElevation = 0.dp
    ) {
        bottomNavItems.forEach { item ->
            val selected = currentRoute == item.screen.route
            NavigationBarItem(
                selected = selected,
                onClick = {
                    navController.navigate(item.screen.route) {
                        popUpTo(navController.graph.findStartDestination().id) {
                            saveState = true
                        }
                        launchSingleTop = true
                        restoreState = true
                    }
                },
                icon = {
                    Icon(
                        imageVector = item.icon,
                        contentDescription = item.label
                    )
                },
                label = {
                    Text(
                        text = item.label,
                        style = TextStyle(
                            fontFamily = FontFamily.SansSerif,
                            fontSize = 11.sp,
                            fontWeight = if (selected) FontWeight.SemiBold else FontWeight.Normal
                        )
                    )
                },
                colors = NavigationBarItemDefaults.colors(
                    selectedIconColor = LucianosPrimary,
                    selectedTextColor = LucianosPrimary,
                    indicatorColor = LucianosPrimarySoft,
                    unselectedIconColor = LucianosInk3,
                    unselectedTextColor = LucianosInk3,
                )
            )
        }
    }
}
