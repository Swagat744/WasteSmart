import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { COLORS, RADIUS, SHADOW } from '../../constants/theme';

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Enter a valid email';
    if (!password.trim()) e.password = 'Password is required';
    else if (password.length < 6) e.password = 'Minimum 6 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
      // Navigation handled automatically by RootLayoutNav
    } catch (err) {
      Alert.alert('Login Failed', err.message || 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (role) => {
    if (role === 'student') {
      setEmail('student@hostel.com');
      setPassword('123456');
    } else {
      setEmail('staff@hostel.com');
      setPassword('123456');
    }
    setErrors({});
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoWrap}>
              <Ionicons name="trash-bin" size={32} color={COLORS.white} />
            </View>
            <Text style={styles.appName}>WasteSmart</Text>
            <Text style={styles.tagline}>Hostel Waste Management</Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Sign in</Text>
            <Text style={styles.cardSub}>Use your hostel credentials</Text>

            {/* Email */}
            <View style={styles.fieldWrap}>
              <Text style={styles.label}>Email address</Text>
              <View style={[styles.inputWrap, errors.email && styles.inputError]}>
                <Ionicons name="mail-outline" size={18} color={COLORS.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="you@hostel.com"
                  placeholderTextColor={COLORS.textMuted}
                  value={email}
                  onChangeText={(v) => { setEmail(v); setErrors(p => ({ ...p, email: '' })); }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
            </View>

            {/* Password */}
            <View style={styles.fieldWrap}>
              <Text style={styles.label}>Password</Text>
              <View style={[styles.inputWrap, errors.password && styles.inputError]}>
                <Ionicons name="lock-closed-outline" size={18} color={COLORS.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor={COLORS.textMuted}
                  value={password}
                  onChangeText={(v) => { setPassword(v); setErrors(p => ({ ...p, password: '' })); }}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(p => !p)} style={styles.eyeBtn}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </View>
              {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
            </View>

            {/* Login Button */}
            <TouchableOpacity
              style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator color={COLORS.white} />
                : <Text style={styles.loginBtnText}>Sign in</Text>
              }
            </TouchableOpacity>

            {/* Demo Buttons */}
            <View style={styles.demoWrap}>
              <Text style={styles.demoLabel}>Try demo:</Text>
              <View style={styles.demoRow}>
                <TouchableOpacity style={styles.demoBtn} onPress={() => fillDemo('student')}>
                  <Ionicons name="school-outline" size={14} color={COLORS.primary} />
                  <Text style={styles.demoBtnText}>Student</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.demoBtn} onPress={() => fillDemo('staff')}>
                  <Ionicons name="construct-outline" size={14} color={COLORS.info} />
                  <Text style={[styles.demoBtnText, { color: COLORS.info }]}>Staff</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <Text style={styles.footer}>WasteSmart v1.0 · VESIT Hostel</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.primary },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  header: { alignItems: 'center', marginBottom: 32 },
  logoWrap: {
    width: 68, height: 68, borderRadius: RADIUS.xl,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
  },
  appName: { fontSize: 28, fontWeight: '700', color: COLORS.white, letterSpacing: 0.5 },
  tagline: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },

  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: 24,
    ...SHADOW.card,
  },
  cardTitle: { fontSize: 22, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 4 },
  cardSub: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 24 },

  fieldWrap: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '500', color: COLORS.textPrimary, marginBottom: 6 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.border,
    borderRadius: RADIUS.md, backgroundColor: COLORS.background,
    paddingHorizontal: 12, height: 48,
  },
  inputError: { borderColor: COLORS.danger },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, fontSize: 15, color: COLORS.textPrimary },
  eyeBtn: { padding: 4 },
  errorText: { fontSize: 12, color: COLORS.danger, marginTop: 4 },

  loginBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  loginBtnDisabled: { opacity: 0.7 },
  loginBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '600' },

  demoWrap: { marginTop: 20, alignItems: 'center' },
  demoLabel: { fontSize: 12, color: COLORS.textMuted, marginBottom: 8 },
  demoRow: { flexDirection: 'row', gap: 10 },
  demoBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderWidth: 1, borderColor: COLORS.border,
    borderRadius: RADIUS.full, paddingHorizontal: 14, paddingVertical: 7,
  },
  demoBtnText: { fontSize: 13, color: COLORS.primary, fontWeight: '500' },

  footer: { textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 24 },
});
