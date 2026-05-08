import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  RefreshControl, Modal, TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { getBinStatus, submitCleaningRequest } from '../../services/api';
import { COLORS, RADIUS, SHADOW } from '../../constants/theme';

const getFillColor = (level) => {
  if (level >= 75) return COLORS.fillHigh;
  if (level >= 50) return COLORS.fillMid;
  return COLORS.fillLow;
};

const getFillBg = (level) => {
  if (level >= 75) return COLORS.dangerLight;
  if (level >= 50) return COLORS.warningLight;
  return COLORS.primaryLight;
};

export default function StudentDashboard() {
  const { user, token, logout } = useAuth();
  const [bins, setBins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedBin, setSelectedBin] = useState(null);
  const [issue, setIssue] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchBins = async () => {
    try {
      const data = await getBinStatus(token);
      setBins(data);
    } catch (e) {
      Alert.alert('Error', 'Could not load bin status');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchBins(); }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchBins();
  }, []);

  const openRequest = (bin) => {
    setSelectedBin(bin);
    setIssue('');
    setModalVisible(true);
  };

  const submitRequest = async () => {
    if (!issue.trim()) { Alert.alert('Error', 'Please describe the issue'); return; }
    setSubmitting(true);
    try {
      await submitCleaningRequest(token, user.id, selectedBin.binId, issue);
      setModalVisible(false);
      Alert.alert('Request Sent!', 'Your cleaning request has been submitted. Staff will be notified.');
    } catch (e) {
      Alert.alert('Error', 'Could not submit request');
    } finally {
      setSubmitting(false);
    }
  };

  const criticalBins = bins.filter(b => b.fillLevel >= 75);

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good morning,</Text>
          <Text style={styles.name}>{user?.name?.split(' ')[0]} 👋</Text>
        </View>
        <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={22} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        showsVerticalScrollIndicator={false}
      >

        {/* Alert Banner */}
        {criticalBins.length > 0 && (
          <View style={styles.alertBanner}>
            <Ionicons name="warning" size={18} color={COLORS.danger} />
            <Text style={styles.alertText}>
              {criticalBins.length} bin{criticalBins.length > 1 ? 's' : ''} need immediate cleaning on Floor {criticalBins.map(b => b.floor).join(', ')}
            </Text>
          </View>
        )}

        {/* Summary Cards */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { backgroundColor: COLORS.primaryLight }]}>
            <Ionicons name="trash-bin-outline" size={22} color={COLORS.primary} />
            <Text style={[styles.summaryVal, { color: COLORS.primaryDark }]}>{bins.length}</Text>
            <Text style={[styles.summaryLabel, { color: COLORS.primary }]}>Total bins</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: COLORS.dangerLight }]}>
            <Ionicons name="alert-circle-outline" size={22} color={COLORS.danger} />
            <Text style={[styles.summaryVal, { color: COLORS.danger }]}>{criticalBins.length}</Text>
            <Text style={[styles.summaryLabel, { color: COLORS.danger }]}>Critical</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: COLORS.infoLight }]}>
            <Ionicons name="star-outline" size={22} color={COLORS.info} />
            <Text style={[styles.summaryVal, { color: COLORS.info }]}>{user?.credits ?? 0}</Text>
            <Text style={[styles.summaryLabel, { color: COLORS.info }]}>Your pts</Text>
          </View>
        </View>

        {/* Bin Status */}
        <Text style={styles.sectionTitle}>Floor-wise bin status</Text>
        <Text style={styles.sectionSub}>Pull down to refresh • Tap a bin to request cleaning</Text>

        {loading ? (
          <ActivityIndicator color={COLORS.primary} style={{ marginTop: 32 }} />
        ) : (
          bins.map((bin) => {
            const fillColor = getFillColor(bin.fillLevel);
            const fillBg = getFillBg(bin.fillLevel);
            return (
              <TouchableOpacity
                key={bin.binId}
                style={styles.binCard}
                onPress={() => openRequest(bin)}
                activeOpacity={0.85}
              >
                <View style={[styles.binIconWrap, { backgroundColor: fillBg }]}>
                  <Ionicons name="trash-bin" size={22} color={fillColor} />
                </View>
                <View style={styles.binInfo}>
                  <View style={styles.binRow}>
                    <Text style={styles.binTitle}>Floor {bin.floor} · Bin #{bin.binId}</Text>
                    <Text style={[styles.binPct, { color: fillColor }]}>{bin.fillLevel}%</Text>
                  </View>
                  <Text style={styles.binLocation}>{bin.location}</Text>
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, { width: `${bin.fillLevel}%`, backgroundColor: fillColor }]} />
                  </View>
                  {bin.fillLevel >= 75 && (
                    <View style={styles.urgentTag}>
                      <Ionicons name="flash" size={11} color={COLORS.danger} />
                      <Text style={styles.urgentText}>Needs cleaning</Text>
                    </View>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
              </TouchableOpacity>
            );
          })
        )}

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Request Cleaning Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Request Cleaning</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={22} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
            {selectedBin && (
              <View style={styles.modalBinInfo}>
                <Ionicons name="location-outline" size={16} color={COLORS.primary} />
                <Text style={styles.modalBinText}>
                  Floor {selectedBin.floor} · Bin #{selectedBin.binId} · {selectedBin.fillLevel}% full
                </Text>
              </View>
            )}
            <Text style={styles.label}>Describe the issue</Text>
            <TextInput
              style={styles.textArea}
              placeholder="e.g. Bin is overflowing, bad smell..."
              placeholderTextColor={COLORS.textMuted}
              value={issue}
              onChangeText={setIssue}
              multiline
              numberOfLines={3}
            />
            <TouchableOpacity
              style={[styles.submitBtn, submitting && { opacity: 0.7 }]}
              onPress={submitRequest}
              disabled={submitting}
            >
              {submitting
                ? <ActivityIndicator color={COLORS.white} />
                : <>
                    <Ionicons name="send" size={16} color={COLORS.white} />
                    <Text style={styles.submitBtnText}>Submit Request</Text>
                  </>
              }
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.primary },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16,
  },
  greeting: { fontSize: 13, color: 'rgba(255,255,255,0.8)' },
  name: { fontSize: 20, fontWeight: '700', color: COLORS.white },
  logoutBtn: { padding: 6 },

  scroll: { flex: 1, backgroundColor: COLORS.background, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  scrollContent: { padding: 16 },

  alertBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: COLORS.dangerLight, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: '#F09595',
    padding: 12, marginBottom: 16,
  },
  alertText: { flex: 1, fontSize: 13, color: COLORS.danger },

  summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  summaryCard: {
    flex: 1, borderRadius: RADIUS.md, padding: 12,
    alignItems: 'center', gap: 4,
  },
  summaryVal: { fontSize: 20, fontWeight: '700' },
  summaryLabel: { fontSize: 11, fontWeight: '500' },

  sectionTitle: { fontSize: 16, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 4 },
  sectionSub: { fontSize: 12, color: COLORS.textMuted, marginBottom: 12 },

  binCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: COLORS.white, borderRadius: RADIUS.lg,
    padding: 14, marginBottom: 10, ...SHADOW.card,
  },
  binIconWrap: { width: 44, height: 44, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' },
  binInfo: { flex: 1 },
  binRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  binTitle: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  binPct: { fontSize: 14, fontWeight: '700' },
  binLocation: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 8 },
  barTrack: { height: 6, backgroundColor: COLORS.border, borderRadius: 10, overflow: 'hidden' },
  barFill: { height: 6, borderRadius: 10 },
  urgentTag: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    marginTop: 6,
  },
  urgentText: { fontSize: 11, color: COLORS.danger, fontWeight: '500' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: COLORS.white, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary },
  modalBinInfo: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.primaryLight, borderRadius: RADIUS.md,
    padding: 10, marginBottom: 16,
  },
  modalBinText: { fontSize: 13, color: COLORS.primaryDark },
  label: { fontSize: 13, fontWeight: '500', color: COLORS.textPrimary, marginBottom: 8 },
  textArea: {
    borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md,
    padding: 12, fontSize: 14, color: COLORS.textPrimary,
    backgroundColor: COLORS.background, textAlignVertical: 'top',
    minHeight: 80, marginBottom: 16,
  },
  submitBtn: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.md,
    height: 50, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8,
  },
  submitBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '600' },
});
