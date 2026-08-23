import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ImageBackground, Animated } from 'react-native';
import { supabase } from '../services/supabase';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';

const bgImage = require('../../assets/blue_school_bg.png');

const AuthScreen = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('teacher');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const scaleAnim = useState(new Animated.Value(1))[0];

  const animatePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.95, useNativeDriver: true }).start();
  };
  const animatePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true }).start();
  };

  const handleAuth = async () => {
    setErrorMessage('');
    if (!email || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }
    setLoading(true);
    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        const userRole = data.user.user_metadata?.role || 'teacher';
        onLogin(userRole);
      } else {
        const { data, error } = await supabase.auth.signUp({
          email, password, options: { data: { role } },
        });
        if (error) throw error;
        setErrorMessage('Success! Check your real email inbox to confirm your account, then log in.');
        setIsLogin(true);
      }
    } catch (error) {
      setErrorMessage(error.message || 'An unknown error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground source={bgImage} style={styles.bgImage} resizeMode="cover">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 5 }}>
            <Text style={styles.title}>EduNova </Text>
            <MaterialCommunityIcons name="rocket" size={30} color="#ff007f" />
          </View>
          <Text style={styles.tagline}>
            Empowering educators anywhere, in any language.
          </Text>
          <Text style={styles.subtitle}>
            {isLogin ? 'Welcome Back!' : 'Create an Account'}
          </Text>
          {errorMessage ? (
            <Text style={[styles.errorText, { color: errorMessage.includes('Success') ? '#059669' : '#e11d48' }]}>
              {errorMessage}
            </Text>
          ) : null}

          <TextInput
            style={styles.input}
            placeholder="Email Address"
            placeholderTextColor="#9ca3af"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#9ca3af"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          {!isLogin && (
            <View style={styles.roleContainer}>
              <Text style={styles.roleLabel}>I am a:</Text>
              <View style={styles.roleButtons}>
                <TouchableOpacity 
                  style={[styles.roleBtn, role === 'teacher' && styles.roleBtnActiveTeacher]}
                  onPress={() => setRole('teacher')}
                >
                  <Text style={[styles.roleBtnText, role === 'teacher' && styles.roleBtnTextActive]}>Teacher</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.roleBtn, role === 'principal' && styles.roleBtnActivePrincipal]}
                  onPress={() => setRole('principal')}
                >
                  <Text style={[styles.roleBtnText, role === 'principal' && styles.roleBtnTextActive]}>Principal</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <Animated.View style={{ transform: [{ scale: scaleAnim }], width: '100%', marginTop: 10 }}>
            <TouchableOpacity 
              style={styles.primaryBtn} 
              onPress={handleAuth} 
              disabled={loading}
              onPressIn={animatePressIn}
              onPressOut={animatePressOut}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={styles.primaryBtnText}>
                  {loading ? 'Processing... ' : (isLogin ? 'Log In ' : 'Sign Up ')}
                </Text>
                {!loading && (
                  isLogin ? (
                    <MaterialCommunityIcons name="rocket" size={18} color="#fff" style={{ marginLeft: 6 }} />
                  ) : (
                    <Feather name="star" size={18} color="#fff" style={{ marginLeft: 6 }} />
                  )
                )}
                {loading && <Feather name="loader" size={18} color="#fff" style={{ marginLeft: 6 }} />}
              </View>
            </TouchableOpacity>
          </Animated.View>

          <TouchableOpacity onPress={() => setIsLogin(!isLogin)} style={styles.toggleButton}>
            <Text style={styles.toggleText}>
              {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Log In"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  bgImage: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#d6e9f7', 
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(214, 233, 247, 0.4)', 
  },
  card: {
    width: '100%',
    maxWidth: 400, 
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 30,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  title: {
    fontSize: 32,
    fontFamily: 'Poppins_900Black',
    color: '#ff007f', 
  },
  tagline: {
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'Poppins_700Bold',
    fontSize: 14,
  },
  subtitle: {
    color: '#0ea5e9', // Cute neon blue
    textAlign: 'center', 
    marginBottom: 20, 
    fontFamily: 'Poppins_900Black',
    fontSize: 18,
  },
  errorText: {
    textAlign: 'center',
    marginBottom: 15,
    fontFamily: 'Poppins_700Bold',
    fontSize: 14,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    color: '#1e293b',
    padding: 15,
    borderRadius: 15,
    marginBottom: 15,
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
  },
  roleContainer: {
    marginBottom: 20,
  },
  roleLabel: {
    fontSize: 16,
    marginBottom: 10,
    fontFamily: 'Poppins_700Bold',
    color: '#0ea5e9',
  },
  roleButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  roleBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    alignItems: 'center',
  },
  roleBtnActiveTeacher: {
    backgroundColor: 'rgba(255, 0, 127, 0.1)',
    borderColor: '#ff007f',
  },
  roleBtnActivePrincipal: {
    backgroundColor: 'rgba(14, 165, 233, 0.1)',
    borderColor: '#0ea5e9',
  },
  roleBtnText: {
    color: '#64748b',
    fontFamily: 'Poppins_700Bold',
  },
  roleBtnTextActive: {
    color: '#1e293b',
  },
  primaryBtn: {
    backgroundColor: '#ff007f',
    padding: 16,
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: '#ff007f',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 5,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'Poppins_900Black',
    letterSpacing: 1,
  },
  toggleButton: {
    marginTop: 25,
    alignItems: 'center',
  },
  toggleText: {
    color: '#0ea5e9',
    fontSize: 15,
    fontFamily: 'Poppins_700Bold',
  },
});

export default AuthScreen;
