import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { getRewards } from '../../services/api';
import { COLORS, RADIUS, SHADOW } from '../../constants/theme';

const REDEMPTION_TIERS = [
  { pts: 100, reward: 'Mess voucher (₹20)', icon: '🎟️' },
  { pts: 200, reward: 'Laundry credit (₹30)', icon: '🧺' },
  { pts: 500, reward: 'Hostel store discount (10%)', icon: '🏷️' },
];

const typeConfig = {
  recycling: { icon: 'leaf-outline', color: COLORS.primary, bg: COLORS.primaryLight, label: 'Recycling' },
  food_claim: { icon: 'fast-food-outline', color: COLORS.info, bg: COLORS.infoLight, label: 'Food claim' },
};

export default function RewardsScreen() {
  const { user, token } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchRewards(); }, []);

  const fetchRewards = async () => {
    try {
      const res = await getRewards(token, user.id);
      setData(res);
    } catch (e) {
      Alert.alert('Error', 'Could not load rewards');
    } finally {
      setLoading(false);
    }
  };

  const totalCredits = data?.totalCredits ?? 0;
  const progress = Math.min((totalCredits / 500) * 100, 100);

  const formatDate = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Rewards & Wallet</Text>
        <Text style={styles.headerSub}>Earn points by recycling and claiming food</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* Credits Card */}
          <View style={styles.creditsCard}>
            <View style={styles.creditsTop}>
              <View>
                <Text style={styles.creditsLabel}>Your balance</Text>
                <Text style={styles.creditsValue}>{totalCredits}</Text>
                <Text style={styles.creditsUnit}>points</Text>
              </View>
              <View style={styles.creditsBadge}>
                <Ionicons name="star" size={32} color="rgba(255,255,255,0.9)" />
              </View>
            </View>

            {/* Progress to next tier */}
            <View style={styles.progressWrap}>
              <View style={styles.progressRow}>
                <Text style={styles.progressLabel}>Progress to 500 pt tier</Text>
                <Text style={styles.progressVal}>{totalCredits}/500</Text>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${progress}%` }]} />
              </View>
            </View>
          </View>

          {/* How to earn */}
          <Text style={styles.sectionTitle}>How to earn points</Text>
          <View style={styles.earnRow}>
            <View style={styles.earnCard}>
              <Text style={styles.earnEmoji}>♻️</Text>
              <Text style={styles.earnPts}>+10 pts</Text>
              <Text style={styles.earnLabel}>Recycling waste</Text>
            </View>
            <View style={styles.earnCard}>
              <Text style={styles.earnEmoji}>🍛</Text>
              <Text style={styles.earnPts}>+5 pts</Text>
              <Text style={styles.earnLabel}>Claiming food</Text>
            </View>
            <View style={styles.earnCard}>
              <Text style={styles.earnEmoji}>🚨</Text>
              <Text style={styles.earnPts}>+3 pts</Text>
              <Text style={styles.earnLabel}>Reporting bins</Text>
            </View>
          </View>

          {/* Redemption Tiers */}
          <Text style={styles.sectionTitle}>Redeem rewards</Text>
          {REDEMPTION_TIERS.map((tier) => {
            const unlocked = totalCredits >= tier.pts;
            return (
              <View key={tier.pts} style={[styles.tierCard, !unlocked && styles.tierLocked]}>
                <Text style={styles.tierEmoji}>{tier.icon}</Text>
                <View style={styles.tierInfo}>
                  <Text style={styles.tierReward}>{tier.reward}</Text>
                  <Text style={styles.tierPts}>{tier.pts} pts required</Text>
                </View>
                <View style={[styles.tierBadge, unlocked ? styles.tierBadgeUnlocked : styles.tierBadgeLocked]}>
                  <Ionicons
                    name={unlocked ? 'checkmark-circle' : 'lock-closed-outline'}
                    size={16}
                    color={unlocked ? COLORS.primary : COLORS.textMuted}
                  />
                  <Text style={[styles.tierBadgeText, unlocked ? { color: COLORS.primaryDark } : { color: COLORS.textMuted }]}>
                    {unlocked ? 'Unlocked' : 'Locked'}
                  </Text>
                </View>
              </View>
            );
          })}

          {/* Transaction History */}
          <Text style={styles.sectionTitle}>Recent activity</Text>
          <View style={styles.historyCard}>
            {data?.transactions?.length === 0 ? (
              <Text style={styles.emptyText}>No transactions yet</Text>
            ) : (
              data?.transactions?.map((txn) => {
                const config = typeConfig[txn.type] || typeConfig.recycling;
                return (
                  <View key={txn.id} style={styles.txnRow}>
                    <View style={[styles.txnIcon, { backgroundColor: config.bg }]}>
                      <Ionicons name={config.icon} size={16} color={config.color} />
                    </View>
                    <View style={styles.txnInfo}>
                      <Text style={styles.txnDesc}>{txn.description}</Text>
                      <Text style={styles.txnDate}>{formatDate(txn.date)}</Text>
                    </View>
                    <Text style={styles.txnCredits}>+{txn.credits}</Text>
                  </View>
                );
              })
            )}
          </View>

          <View style={{ height: 20 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: { backgroundColor: COLORS.white, padding: 20, paddingTop: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  headerTitle: { fontSize: 22, fontWeight: '700', color: COLORS.textPrimary },
  headerSub: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  scroll: { padding: 16 },

  creditsCard: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.xl,
    padding: 20, marginBottom: 20,
  },
  creditsTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  creditsLabel: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 4 },
  creditsValue: { fontSize: 48, fontWeight: '700', color: COLORS.white, lineHeight: 52 },
  creditsUnit: { fontSize: 14, color: 'rgba(255,255,255,0.7)' },
  creditsBadge: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  progressWrap: {},
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressLabel: { fontSize: 12, color: 'rgba(255,255,255,0.8)' },
  progressVal: { fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: '600' },
  progressTrack: { height: 6, backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 10, overflow: 'hidden' },
  progressFill: { height: 6, backgroundColor: COLORS.white, borderRadius: 10 },

  sectionTitle: { fontSize: 16, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 12 },

  earnRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  earnCard: {
    flex: 1, backgroundColor: COLORS.white, borderRadius: RADIUS.md,
    padding: 12, alignItems: 'center', gap: 4, ...SHADOW.subtle,
  },
  earnEmoji: { fontSize: 24 },
  earnPts: { fontSize: 14, fontWeight: '700', color: COLORS.primaryDark },
  earnLabel: { fontSize: 11, color: COLORS.textSecondary, textAlign: 'center' },

  tierCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: COLORS.white, borderRadius: RADIUS.lg,
    padding: 14, marginBottom: 10, ...SHADOW.subtle,
  },
  tierLocked: { opacity: 0.6 },
  tierEmoji: { fontSize: 26 },
  tierInfo: { flex: 1 },
  tierReward: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  tierPts: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  tierBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: RADIUS.full },
  tierBadgeUnlocked: { backgroundColor: COLORS.primaryLight },
  tierBadgeLocked: { backgroundColor: COLORS.background },
  tierBadgeText: { fontSize: 12, fontWeight: '500' },

  historyCard: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.lg,
    padding: 4, ...SHADOW.subtle, marginBottom: 8,
  },
  txnRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 },
  txnIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  txnInfo: { flex: 1 },
  txnDesc: { fontSize: 14, color: COLORS.textPrimary, fontWeight: '500' },
  txnDate: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  txnCredits: { fontSize: 15, fontWeight: '700', color: COLORS.primaryDark },
  emptyText: { textAlign: 'center', padding: 20, color: COLORS.textSecondary },
});
