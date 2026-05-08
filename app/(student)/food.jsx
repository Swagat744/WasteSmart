import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useAuth } from '../../context/AuthContext';
import { getFoodItems, claimFood } from '../../services/api';
import { COLORS, RADIUS, SHADOW } from '../../constants/theme';

const getTimeLeft = (expiry) => {
  const diff = new Date(expiry) - new Date();
  if (diff <= 0) return 'Expired';
  const hrs = Math.floor(diff / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  if (hrs > 0) return `${hrs}h ${mins}m left`;
  return `${mins}m left`;
};

export default function FoodScreen() {
  const { user, token } = useAuth();
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scanItem, setScanItem] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    fetchFoods();
  }, []);

  const fetchFoods = async () => {
    try {
      const data = await getFoodItems(token);
      setFoods(data);
    } catch (e) {
      Alert.alert('Error', 'Could not load food items');
    } finally {
      setLoading(false);
    }
  };

  const openScanner = async (item) => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert('Camera Permission', 'Camera access is needed to scan QR codes.');
        return;
      }
    }
    setScanItem(item);
    setScanned(false);
    setScanning(true);
  };

  const handleBarCodeScanned = async ({ data }) => {
    if (scanned) return;
    setScanned(true);
    setScanning(false);
    setClaiming(true);
    try {
      // In mock mode, any QR = 'MOCK_QR'. In production, real QR value is sent.
      const mockQR = 'MOCK_QR';
      const result = await claimFood(token, user.id, scanItem.foodId, mockQR);
      fetchFoods();
      Alert.alert('Claimed! 🎉', `You claimed ${scanItem.dish} and earned ${result.creditsEarned} credits!`);
    } catch (e) {
      Alert.alert('Claim Failed', e.message || 'Could not claim food item');
    } finally {
      setClaiming(false);
      setScanItem(null);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Surplus Food</Text>
        <Text style={styles.headerSub}>Claim before it expires · Earn 5 pts per claim</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {foods.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="fast-food-outline" size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>No surplus food available right now</Text>
            </View>
          ) : (
            foods.map((item) => {
              const timeLeft = getTimeLeft(item.expiry);
              const expired = timeLeft === 'Expired';
              const isLow = item.status === 'low';
              return (
                <View key={item.foodId} style={[styles.foodCard, expired && styles.foodCardExpired]}>
                  <View style={styles.foodTop}>
                    <View style={styles.emojiWrap}>
                      <Text style={styles.emoji}>{item.emoji}</Text>
                    </View>
                    <View style={styles.foodInfo}>
                      <Text style={styles.foodName}>{item.dish}</Text>
                      <Text style={styles.foodMeta}>by {item.postedBy}</Text>
                      <View style={styles.tagsRow}>
                        <View style={[styles.tag, isLow ? styles.tagLow : styles.tagAvail]}>
                          <Text style={[styles.tagText, isLow ? styles.tagTextLow : styles.tagTextAvail]}>
                            {item.quantity} portions
                          </Text>
                        </View>
                        <View style={[styles.tag, expired ? styles.tagExpired : styles.tagTime]}>
                          <Ionicons name="time-outline" size={11} color={expired ? COLORS.danger : COLORS.textSecondary} />
                          <Text style={[styles.tagText, { color: expired ? COLORS.danger : COLORS.textSecondary }]}>
                            {timeLeft}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  {!expired && item.quantity > 0 && (
                    <TouchableOpacity
                      style={styles.claimBtn}
                      onPress={() => openScanner(item)}
                      activeOpacity={0.85}
                    >
                      <Ionicons name="qr-code-outline" size={16} color={COLORS.white} />
                      <Text style={styles.claimBtnText}>Scan QR to Claim</Text>
                    </TouchableOpacity>
                  )}
                  {(expired || item.quantity === 0) && (
                    <View style={styles.unavailBtn}>
                      <Text style={styles.unavailText}>{expired ? 'Expired' : 'Out of stock'}</Text>
                    </View>
                  )}
                </View>
              );
            })
          )}

          <View style={styles.infoCard}>
            <Ionicons name="information-circle-outline" size={18} color={COLORS.info} />
            <Text style={styles.infoText}>
              Ask mess staff to show you the QR code at the counter when claiming food.
            </Text>
          </View>

          <View style={{ height: 20 }} />
        </ScrollView>
      )}

      {/* QR Scanner Modal */}
      <Modal visible={scanning} animationType="slide">
        <SafeAreaView style={styles.scannerSafe}>
          <View style={styles.scannerHeader}>
            <TouchableOpacity onPress={() => setScanning(false)} style={styles.scannerClose}>
              <Ionicons name="close" size={24} color={COLORS.white} />
            </TouchableOpacity>
            <Text style={styles.scannerTitle}>Scan QR Code</Text>
            <View style={{ width: 36 }} />
          </View>
          {scanItem && (
            <Text style={styles.scannerSub}>Claiming: {scanItem.dish}</Text>
          )}
          <CameraView
            style={styles.camera}
            facing="back"
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          />
          <View style={styles.scannerFrame}>
            <View style={styles.scanCorner} />
          </View>
          {claiming && (
            <View style={styles.claimingOverlay}>
              <ActivityIndicator color={COLORS.white} size="large" />
              <Text style={styles.claimingText}>Processing claim...</Text>
            </View>
          )}
          <Text style={styles.scannerHint}>Point camera at the QR code shown by mess staff</Text>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: { backgroundColor: COLORS.white, padding: 20, paddingTop: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  headerTitle: { fontSize: 22, fontWeight: '700', color: COLORS.textPrimary },
  headerSub: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  scroll: { padding: 16 },

  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 15, color: COLORS.textSecondary, textAlign: 'center' },

  foodCard: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.lg,
    padding: 16, marginBottom: 12, ...SHADOW.card,
  },
  foodCardExpired: { opacity: 0.6 },
  foodTop: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  emojiWrap: {
    width: 52, height: 52, borderRadius: RADIUS.md,
    backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  emoji: { fontSize: 26 },
  foodInfo: { flex: 1 },
  foodName: { fontSize: 16, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 2 },
  foodMeta: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 8 },
  tagsRow: { flexDirection: 'row', gap: 6 },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.full },
  tagAvail: { backgroundColor: COLORS.primaryLight },
  tagLow: { backgroundColor: COLORS.warningLight },
  tagTime: { backgroundColor: COLORS.background },
  tagExpired: { backgroundColor: COLORS.dangerLight },
  tagText: { fontSize: 11, fontWeight: '500' },
  tagTextAvail: { color: COLORS.primaryDark },
  tagTextLow: { color: COLORS.warning },

  claimBtn: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.md,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, height: 44,
  },
  claimBtnText: { color: COLORS.white, fontSize: 15, fontWeight: '600' },
  unavailBtn: {
    backgroundColor: COLORS.border, borderRadius: RADIUS.md,
    height: 44, alignItems: 'center', justifyContent: 'center',
  },
  unavailText: { fontSize: 14, color: COLORS.textSecondary, fontWeight: '500' },

  infoCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: COLORS.infoLight, borderRadius: RADIUS.md, padding: 12, marginTop: 4,
  },
  infoText: { flex: 1, fontSize: 13, color: COLORS.info, lineHeight: 20 },

  // Scanner
  scannerSafe: { flex: 1, backgroundColor: '#000' },
  scannerHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16,
  },
  scannerClose: { padding: 6 },
  scannerTitle: { fontSize: 18, fontWeight: '600', color: COLORS.white },
  scannerSub: { textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 8 },
  camera: { flex: 1 },
  scannerFrame: { position: 'absolute', top: '35%', left: '20%', right: '20%', bottom: '35%', borderWidth: 2, borderColor: COLORS.white, borderRadius: 12 },
  scanCorner: {},
  claimingOverlay: {
    position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center', justifyContent: 'center', gap: 12,
  },
  claimingText: { color: COLORS.white, fontSize: 16, fontWeight: '500' },
  scannerHint: { textAlign: 'center', color: 'rgba(255,255,255,0.6)', fontSize: 13, padding: 16 },
});
