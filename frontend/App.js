import React, { useState, useEffect } from 'react';
import { SafeAreaView, StyleSheet, StatusBar, Text, View, Button, TouchableOpacity, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts, Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold, Poppins_900Black } from '@expo-google-fonts/poppins';
import MainScreen from './src/screens/MainScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import AuthScreen from './src/screens/AuthScreen';
import AdminScreen from './src/screens/AdminScreen';
import { initDb } from './src/services/db';
import { supabase } from './src/services/supabase';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('loading');
  const [dbReady, setDbReady] = useState(false);
  const [userRole, setUserRole] = useState(null);

  let [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_900Black,
  });

  if (fontsLoaded) {
    Text.defaultProps = Text.defaultProps || {};
    Text.defaultProps.style = [{ fontFamily: 'Poppins_400Regular' }, Text.defaultProps.style];
    TextInput.defaultProps = TextInput.defaultProps || {};
    TextInput.defaultProps.style = [{ fontFamily: 'Poppins_400Regular' }, TextInput.defaultProps.style];
  }

  useEffect(() => {
    async function setup() {
      // 1. Initialize SQLite Database
      await initDb();
      setDbReady(true);
      
      // 2. Check active auth session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        let role = session.user.user_metadata?.role;
        if (!role) {
          role = (session.user.email.includes('admin') || session.user.email.includes('principal')) ? 'principal' : 'teacher';
        }
        setUserRole(role);
        // check onboarding
        try {
          const hasSeen = await AsyncStorage.getItem('@has_seen_onboarding');
          if (hasSeen === 'true') {
            setCurrentScreen(role === 'principal' ? 'admin' : 'main');
          } else {
            setCurrentScreen('onboarding');
          }
        } catch (e) {
          setCurrentScreen('onboarding');
        }
      } else {
        // Not logged in
        setCurrentScreen('auth');
      }

      // Listen for auth changes
      supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session) {
          let role = session.user.user_metadata?.role;
          if (!role) {
            role = (session.user.email.includes('admin') || session.user.email.includes('principal')) ? 'principal' : 'teacher';
          }
          setUserRole(role);
          try {
            const hasSeen = await AsyncStorage.getItem('@has_seen_onboarding');
            if (hasSeen === 'true') {
              setCurrentScreen(role === 'principal' ? 'admin' : 'main');
            } else {
              setCurrentScreen('onboarding');
            }
          } catch (e) {
            setCurrentScreen('onboarding');
          }
        } else {
          setUserRole(null);
          setCurrentScreen('auth');
        }
      });
    }
    setup();
  }, []);

  const handleOnboardingComplete = async () => {
    try {
      await AsyncStorage.setItem('@has_seen_onboarding', 'true');
    } catch (e) {
      console.error("Failed to save onboarding state");
    }
    setCurrentScreen(userRole === 'principal' ? 'admin' : 'main');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (!dbReady || currentScreen === 'loading' || !fontsLoaded) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center' }]}>
        <Text style={{textAlign: 'center'}}>Loading AI Co-Teacher...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      {currentScreen === 'auth' && (
        <AuthScreen onLogin={() => {}} />
      )}
      {currentScreen === 'onboarding' && (
        <OnboardingScreen onComplete={handleOnboardingComplete} />
      )}
      {currentScreen === 'main' && (
        <MainScreen 
          onHistoryPress={() => setCurrentScreen('history')} 
          onLogout={handleLogout}
        />
      )}
      {currentScreen === 'admin' && (
        <AdminScreen onLogout={handleLogout} />
      )}
      {currentScreen === 'history' && (
        <HistoryScreen onBack={() => setCurrentScreen('main')} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
});
