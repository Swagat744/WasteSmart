import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { getStaffTasks, updateTaskStatus } from '../../services/api';
import { COLORS, RADIUS, SHADOW } from '../../constants/theme';

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: COLORS.warning, bg: COLORS.warningLight, icon: 'time-outline' },
  in_progress: { label: 'In progress', color: COLORS.info, bg: COLORS.infoLight, icon: 'reload-outline' },
  completed: { label: 'Completed', color: COLORS.primary, bg: COLORS.primaryLight, icon: 'checkmark-circle-outline' },
};

export default function StaffTasks() {
  const { user, token } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updating, setUpdating] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => { fetchTasks(); }, []);

  const fetchTasks = async () => {
    try {
      const data = await getStaffTasks(token, user.id);
      setTasks(data);
    } catch (e) {
      Alert.alert('Error', 'Could not load tasks');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchTasks();
  }, []);

  const handleStatusUpdate = async (taskId, newStatus) => {
    const label = newStatus === 'in_progress' ? 'start this task' : 'mark this task as complete';
    Alert.alert(
      'Confirm',
      `Are you sure you want to ${label}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes',
          onPress: async () => {
            setUpdating(taskId);
            try {
              await updateTaskStatus(token, taskId, newStatus);
              setTasks(prev => prev.map(t => t.taskId === taskId ? { ...t, status: newStatus } : t));
            } catch (e) {
              Alert.alert('Error', 'Could not update task');
            } finally {
              setUpdating(null);
            }
          },
        },
      ]
    );
  };

  const filtered = filter === 'all' ? tasks : tasks.filter(t => t.status === filter);

  const formatTime = (iso) => {
    const d = new Date(iso);
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Tasks</Text>
        <Text style={styles.headerSub}>{tasks.length} assigned today</Text>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {['all', 'pending', 'in_progress', 'completed'].map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterTab, filter === f && styles.filterTabActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f === 'all' ? 'All' : f === 'in_progress' ? 'Active' : f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator color={COLORS.info} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.info} />}
          showsVerticalScrollIndicator={false}
        >
          {filtered.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="checkbox-outline" size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>No tasks in this category</Text>
            </View>
          ) : (
            filtered.map((task) => {
              const config = STATUS_CONFIG[task.status];
              const isUpdating = updating === task.taskId;
              return (
                <View key={task.taskId} style={styles.taskCard}>
                  {/* Task Header */}
                  <View style={styles.taskHeader}>
                    <View style={[styles.taskStatusBadge, { backgroundColor: config.bg }]}>
                      <Ionicons name={config.icon} size={13} color={config.color} />
                      <Text style={[styles.taskStatusText, { color: config.color }]}>{config.label}</Text>
                    </View>
                    <Text style={styles.taskTime}>{formatTime(task.reportedAt)}</Text>
                  </View>

                  {/* Task Info */}
                  <View style={styles.taskInfo}>
                    <View style={styles.taskInfoRow}>
                      <Ionicons name="trash-bin-outline" size={15} color={COLORS.textSecondary} />
                      <Text style={styles.taskInfoText}>Bin #{task.binId} · Floor {task.floor}</Text>
                    </View>
                    <View style={styles.taskInfoRow}>
                      <Ionicons name="location-outline" size={15} color={COLORS.textSecondary} />
                      <Text style={styles.taskInfoText}>{task.location}</Text>
                    </View>
                    <View style={styles.taskInfoRow}>
                      <Ionicons name="chatbubble-outline" size={15} color={COLORS.textSecondary} />
                      <Text style={styles.taskInfoText}>{task.issue}</Text>
                    </View>
                  </View>

                  {/* Action Buttons */}
                  {task.status === 'pending' && (
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.startBtn]}
                      onPress={() => handleStatusUpdate(task.taskId, 'in_progress')}
                      disabled={isUpdating}
                    >
                      {isUpdating
                        ? <ActivityIndicator color={COLORS.white} size="small" />
                        : <>
                            <Ionicons name="play" size={15} color={COLORS.white} />
                            <Text style={styles.actionBtnText}>Start Task</Text>
                          </>
                      }
                    </TouchableOpacity>
                  )}
                  {task.status === 'in_progress' && (
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.doneBtn]}
                      onPress={() => handleStatusUpdate(task.taskId, 'completed')}
                      disabled={isUpdating}
                    >
                      {isUpdating
                        ? <ActivityIndicator color={COLORS.white} size="small" />
                        : <>
                            <Ionicons name="checkmark" size={15} color={COLORS.white} />
                            <Text style={styles.actionBtnText}>Mark Complete</Text>
                          </>
                      }
                    </TouchableOpacity>
                  )}
                  {task.status === 'completed' && (
                    <View style={styles.completedRow}>
                      <Ionicons name="checkmark-circle" size={16} color={COLORS.primary} />
                      <Text style={styles.completedText}>Task completed · Great work!</Text>
                    </View>
                  )}
                </View>
              );
            })
          )}

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

  filterRow: {
    flexDirection: 'row', backgroundColor: COLORS.white,
    paddingHorizontal: 16, paddingBottom: 12, gap: 6,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  filterTab: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIUS.full, backgroundColor: COLORS.background },
  filterTabActive: { backgroundColor: COLORS.infoLight },
  filterText: { fontSize: 12, fontWeight: '500', color: COLORS.textSecondary },
  filterTextActive: { color: COLORS.info },

  scroll: { padding: 16 },

  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 15, color: COLORS.textSecondary },

  taskCard: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.lg,
    padding: 14, marginBottom: 12, ...SHADOW.card,
  },
  taskHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  taskStatusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.full },
  taskStatusText: { fontSize: 12, fontWeight: '600' },
  taskTime: { fontSize: 12, color: COLORS.textMuted },

  taskInfo: { gap: 6, marginBottom: 14 },
  taskInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  taskInfoText: { fontSize: 13, color: COLORS.textSecondary, flex: 1 },

  actionBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, height: 44, borderRadius: RADIUS.md,
  },
  startBtn: { backgroundColor: COLORS.info },
  doneBtn: { backgroundColor: COLORS.primary },
  actionBtnText: { color: COLORS.white, fontSize: 15, fontWeight: '600' },

  completedRow: { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center', paddingVertical: 8 },
  completedText: { fontSize: 13, color: COLORS.primaryDark, fontWeight: '500' },
});
