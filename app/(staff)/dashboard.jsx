import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { getBinStatus, getStaffTasks } from '../../services/api';
import { COLORS, RADIUS, SHADOW } from '../../constants/theme';

const getFillColor = (level) => {
  if (level >= 75) return COLORS.fillHigh;
  if (level >= 50) return COLORS.fillMid;
  return COLORS.fillLow;
};

export default function StaffDashboard() {
  const { user, token, logout } = useAuth();
  const [bins, setBins] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [binsData, tasksData] = await Promise.all([
        getBinStatus(token),
        getStaffTasks(token, user.id),
      ]);
      setBins(binsData);
      setTasks(tasksData);
    } catch (e) {
      Alert.alert('Error', 'Could not load data');
    } finally {
      setLoading(false);
    }
  };

  const pending = tasks.filter(t => t.status === 'pending').length;
  const inProgress = tasks.filter(t => t.status === 'in_progress').length;
  const done = tasks.filter(t => t.status === 'completed').length;
  const criticalBins = bins.filter(b => b.fillLevel >= 75);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.name}>{user?.name?.split(' ')[0]} 🧹</Text>
        </View>
        <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={20} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={COLORS.info} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* Shift info */}
          <View style={styles.shiftCard}>
            <Ionicons name="time-outline" size={18} color={COLORS.info} />
            <Text style={styles.shiftText}>
              Shift: Morning (6 AM – 2 PM) · {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}
            </Text>
          </View>

          {/* Task Summary */}
          <Text style={styles.sectionTitle}>Today's summary</Text>
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: COLORS.warningLight }]}>
              <Text style={[styles.statVal, { color: COLORS.warning }]}>{pending}</Text>
              <Text style={[styles.statLabel, { color: COLORS.warning }]}>Pending</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: COLORS.infoLight }]}>
              <Text style={[styles.statVal, { color: COLORS.info }]}>{inProgress}</Text>
              <Text style={[styles.statLabel, { color: COLORS.info }]}>In progress</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: COLORS.primaryLight }]}>
              <Text style={[styles.statVal, { color: COLORS.primaryDark }]}>{done}</Text>
              <Text style={[styles.statLabel, { color: COLORS.primaryDark }]}>Completed</Text>
            </View>
          </View>

          {/* Critical Bins Alert */}
          {criticalBins.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Critical bins 🚨</Text>
              {criticalBins.map(bin => (
                <View key={bin.binId} style={styles.criticalCard}>
                  <View style={styles.criticalLeft}>
                    <View style={styles.criticalIcon}>
                      <Ionicons name="trash-bin" size={20} color={COLORS.danger} />
                    </View>
                    <View>
                      <Text style={styles.criticalTitle}>Bin #{bin.binId} · Floor {bin.floor}</Text>
                      <Text style={styles.criticalSub}>{bin.location} · {bin.fillLevel}% full</Text>
                    </View>
                  </View>
                  <View style={styles.criticalBadge}>
                    <Text style={styles.criticalBadgeText}>URGENT</Text>
                  </View>
                </View>
              ))}
            </>
          )}

          {/* All Bins Overview */}
          <Text style={styles.sectionTitle}>All bins overview</Text>
          {bins.map((bin) => {
            const color = getFillColor(bin.fillLevel);
            return (
              <View key={bin.binId} style={styles.binRow}>
                <View style={styles.binLeft}>
                  <View style={[styles.binDot, { backgroundColor: color }]} />
                  <Text style={styles.binName}>Floor {bin.floor} · #{bin.binId}</Text>
                </View>
                <View style={styles.binBarWrap}>
                  <View style={styles.binBar}>
                    <View style={[styles.binBarFill, { width: `${bin.fillLevel}%`, backgroundColor: color }]} />
                  </View>
                  <Text style={[styles.binPct, { color }]}>{bin.fillLevel}%</Text>
                </View>
              </View>
            );
          })}

          <View style={{ height: 20 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: COLORS.white, padding: 20, paddingTop: 16,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  greeting: { fontSize: 13, color: COLORS.textSecondary },
  name: { fontSize: 20, fontWeight: '700', color: COLORS.textPrimary },
  logoutBtn: { padding: 6 },

  scroll: { padding: 16 },

  shiftCard: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.infoLight, borderRadius: RADIUS.md,
    padding: 12, marginBottom: 20,
  },
  shiftText: { fontSize: 13, color: COLORS.info, flex: 1 },

  sectionTitle: { fontSize: 16, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 12 },

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statCard: { flex: 1, borderRadius: RADIUS.md, padding: 14, alignItems: 'center', gap: 4 },
  statVal: { fontSize: 24, fontWeight: '700' },
  statLabel: { fontSize: 12, fontWeight: '500' },

  criticalCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: COLORS.dangerLight, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: '#F09595',
    padding: 12, marginBottom: 8,
  },
  criticalLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  criticalIcon: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(226,75,74,0.15)', alignItems: 'center', justifyContent: 'center',
  },
  criticalTitle: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  criticalSub: { fontSize: 12, color: COLORS.textSecondary },
  criticalBadge: { backgroundColor: COLORS.danger, borderRadius: RADIUS.full, paddingHorizontal: 8, paddingVertical: 4 },
  criticalBadgeText: { fontSize: 10, fontWeight: '700', color: COLORS.white, letterSpacing: 0.5 },

  binRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: COLORS.white, borderRadius: RADIUS.md,
    padding: 12, marginBottom: 8, ...SHADOW.subtle,
  },
  binLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  binDot: { width: 10, height: 10, borderRadius: 5 },
  binName: { fontSize: 13, fontWeight: '500', color: COLORS.textPrimary },
  binBarWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, justifyContent: 'flex-end' },
  binBar: { width: 80, height: 6, backgroundColor: COLORS.border, borderRadius: 10, overflow: 'hidden' },
  binBarFill: { height: 6, borderRadius: 10 },
  binPct: { fontSize: 12, fontWeight: '600', width: 34, textAlign: 'right' },
});
