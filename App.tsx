import React, { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Ionicons from '@expo/vector-icons/Ionicons';

import { initDatabase } from './src/db/database';
import { getIsSetupComplete, markSetupComplete } from './src/db/queries';
import { Colors, FontWeights } from './src/theme';
import { HardwareProvider } from './src/hardware/HardwareContext';
import { UISettingsProvider, useUI } from './src/context/UISettings';

import DashboardScreen from './src/screens/DashboardScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import HardwareScreen from './src/screens/HardwareScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';

const Tab = createBottomTabNavigator();

const NavTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: Colors.bg,
  },
};

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <UISettingsProvider>
          <HardwareProvider>
            <Root />
          </HardwareProvider>
        </UISettingsProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function Root() {
  const { fonts } = useUI();
  const [ready, setReady] = useState(false);
  const [minSplashDone, setMinSplashDone] = useState(false);
  const [isSetup, setIsSetup] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        await initDatabase();
        const setup = await getIsSetupComplete();
        setIsSetup(setup);
      } catch (e: any) {
        setError(e?.message ?? 'Erreur au démarrage');
      } finally {
        setReady(true);
      }
    })();
  }, []);

  // Always show the splash for at least ~1.8 s so it appears on every launch,
  // even when the database initialises almost instantly.
  useEffect(() => {
    const t = setTimeout(() => setMinSplashDone(true), 1800);
    return () => clearTimeout(t);
  }, []);

  const handleOnboardingComplete = async () => {
    await markSetupComplete();
    setIsSetup(true);
  };

  if (!ready || !minSplashDone) {
    return (
      <View style={styles.splash}>
        <StatusBar style="dark" />
        <Text style={styles.splashTitle}>Distrucare</Text>
        <Text style={styles.splashSub}>Votre compagnon de prise de médicaments</Text>
        <ActivityIndicator color={Colors.accent} style={{ marginTop: 32 }} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.splash}>
        <StatusBar style="dark" />
        <Text style={[styles.splashSub, { color: Colors.missed }]}>{error}</Text>
      </View>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      {!isSetup ? (
        <OnboardingScreen onComplete={handleOnboardingComplete} />
      ) : (
        <NavigationContainer theme={NavTheme}>
          <Tab.Navigator
            screenOptions={({ route }) => ({
              headerShown: false,
              tabBarStyle: styles.tabBar,
              tabBarActiveTintColor: Colors.accent,
              tabBarInactiveTintColor: Colors.textMuted,
              tabBarLabelStyle: { fontSize: Math.min(fonts.xs, 14), fontWeight: FontWeights.semibold },
              tabBarIcon: ({ focused, color, size }) => {
                let icon: keyof typeof Ionicons.glyphMap;
                if (route.name === 'Dashboard') {
                  icon = focused ? 'home' : 'home-outline';
                } else if (route.name === 'History') {
                  icon = focused ? 'calendar' : 'calendar-outline';
                } else if (route.name === 'Hardware') {
                  icon = focused ? 'hardware-chip' : 'hardware-chip-outline';
                } else {
                  icon = focused ? 'settings' : 'settings-outline';
                }
                return <Ionicons name={icon} size={size} color={color} />;
              },
            })}
          >
            <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ tabBarLabel: 'Accueil' }} />
            <Tab.Screen name="History" component={HistoryScreen} options={{ tabBarLabel: 'Historique' }} />
            <Tab.Screen name="Hardware" component={HardwareScreen} options={{ tabBarLabel: 'Appareil' }} />
            <Tab.Screen name="Settings" component={SettingsScreen} options={{ tabBarLabel: 'Réglages' }} />
          </Tab.Navigator>
        </NavigationContainer>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: Colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  splashTitle: {
    fontSize: 36,
    fontWeight: FontWeights.extrabold,
    color: Colors.accent,
    letterSpacing: -1,
  },
  splashSub: {
    fontSize: 17,
    color: Colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  tabBar: {
    backgroundColor: Colors.bgCard,
    borderTopColor: Colors.border,
    borderTopWidth: 1,
    height: 72,
    paddingBottom: 10,
    paddingTop: 8,
  },
});
