import React, { useMemo, useState } from 'react';
import { Alert, FlatList, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import AppText from '../../../shared/components/AppText';
import Avatar from '../../../shared/components/Avatar';
import Badge from '../../../shared/components/Badge';
import Button from '../../../shared/components/Button';
import ChipGroup from '../../../shared/components/Chip';
import EmptyState from '../../../shared/components/EmptyState';
import IconButton from '../../../shared/components/IconButton';
import Screen from '../../../shared/components/Screen';
import SegmentedControl from '../../../shared/components/SegmentedControl';
import { useToast } from '../../../shared/components/Toast';
import { useAppData, useLookup } from '../../../shared/context/AppDataContext';
import { PRIORITY, REQUEST_STATUS, statusMeta } from '../../../shared/data/constants';
import { useHaptics } from '../../../shared/hooks/useHaptics';
import { useStyles, useTheme } from '../../../shared/theme/ThemeProvider';
import { daysBetweenInclusive, formatDate, relativeDay } from '../../../shared/utils/date';

const ALL = 'all';

export default function RequestsScreen({ navigation }) {
  const { leaveRequests, specialRequests, updateLeaveRequest, updateSpecialRequest } = useAppData();
  const personnel = useLookup('personnel');
  const toast = useToast();
  const haptics = useHaptics();
  const styles = useStyles(makeStyles);
  const [tab, setTab] = useState('leave');
  const [status, setStatus] = useState(ALL);
  const isLeave = tab === 'leave';
  const requests = isLeave ? leaveRequests : specialRequests;
  const update = isLeave ? updateLeaveRequest : updateSpecialRequest;

  const filtered = useMemo(
    () =>
      requests
        .filter(r => status === ALL || r.status === status)
        .sort(
          (a, b) =>
            (a.status === 'pending' ? 0 : 1) - (b.status === 'pending' ? 0 : 1) ||
            (b.submittedDate || '').localeCompare(a.submittedDate || '')
        ),
    [requests, status]
  );
  const pending = list => list.filter(r => r.status === 'pending').length;

  const decide = (request, next) => {
    const approve = next === 'approved';
    Alert.alert(approve ? 'Talebi onayla' : 'Talebi reddet', `${request.employeeName} adlı personelin talebi ${approve ? 'onaylansın' : 'reddedilsin'} mı?`, [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: approve ? 'Onayla' : 'Reddet',
        style: approve ? 'default' : 'destructive',
        onPress: () => {
          update({ id: request.id, status: next });
          if (approve) haptics.success();
          else haptics.warning();
          toast.show(approve ? 'Talep onaylandı' : 'Talep reddedildi', {
            tone: approve ? 'success' : 'info',
            action: { label: 'Geri al', onPress: () => update({ id: request.id, status: 'pending' }) },
          });
        },
      },
    ]);
  };

  return (
    <Screen
      title="Talepler"
      onBack={navigation.goBack}
      scroll={false}
      right={
        <IconButton
          icon="plus"
          onPress={() => navigation.navigate(isLeave ? 'LeaveRequestForm' : 'SpecialRequestForm')}
          accessibilityLabel="Yeni talep"
        />
      }
    >
      <View style={styles.controls}>
        <SegmentedControl
          options={[
            { value: 'leave', label: 'İzin', badge: pending(leaveRequests) || undefined },
            { value: 'special', label: 'Özel talep', badge: pending(specialRequests) || undefined },
          ]}
          value={tab}
          onChange={next => {
            setTab(next);
            setStatus(ALL);
          }}
        />
        <ChipGroup
          scroll
          options={[
            { value: ALL, label: 'Tümü', count: requests.length },
            ...Object.entries(REQUEST_STATUS).map(([value, meta]) => ({
              value,
              label: meta.label,
              tone: meta.tone,
              count: requests.filter(r => r.status === value).length,
            })),
          ]}
          value={status}
          onChange={setStatus}
        />
      </View>
      <FlatList
        data={filtered}
        keyExtractor={r => r.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <RequestCard
            request={item}
            isLeave={isLeave}
            avatar={personnel[item.personnelId]?.avatar}
            onApprove={() => decide(item, 'approved')}
            onReject={() => decide(item, 'rejected')}
            onOpenPerson={personnel[item.personnelId] ? () => navigation.navigate('PersonnelProfile', { id: item.personnelId }) : undefined}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            icon="inbox"
            title="Talep bulunamadı"
            actionLabel="Yeni talep"
            onAction={() => navigation.navigate(isLeave ? 'LeaveRequestForm' : 'SpecialRequestForm')}
          />
        }
      />
    </Screen>
  );
}

function RequestCard({ request: r, isLeave, avatar, onApprove, onReject, onOpenPerson }) {
  const { colors } = useTheme();
  const styles = useStyles(makeStyles);
  const status = statusMeta(REQUEST_STATUS, r.status);
  const priority = !isLeave ? statusMeta(PRIORITY, r.priority) : null;
  const days = isLeave ? daysBetweenInclusive(r.startDate, r.endDate) : null;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Avatar uri={avatar} name={r.employeeName} size={40} />
        <View style={styles.flex}>
          <AppText variant="bodyMedium" onPress={onOpenPerson}>
            {r.employeeName}
          </AppText>
          <AppText variant="small" color="secondary">
            {isLeave ? r.requestType : r.requestCategory} · {relativeDay(r.submittedDate, new Date(), 'd MMM')}
          </AppText>
        </View>
        <Badge label={status.label} tone={status.tone} dot />
      </View>

      {isLeave ? (
        <View style={styles.leaveBox}>
          <Feather name="calendar" size={16} color={colors.textTertiary} />
          <AppText variant="smallMedium" style={styles.flex}>
            {formatDate(r.startDate, 'd MMM')} – {formatDate(r.endDate, 'd MMM yyyy')}
          </AppText>
          <AppText variant="smallMedium" color="brand">
            {days ? `${days} gün` : '—'}
          </AppText>
        </View>
      ) : (
        <View style={styles.titleRow}>
          <AppText variant="h3" style={styles.flex}>
            {r.requestTitle}
          </AppText>
          {priority ? <Badge label={priority.label} tone={priority.tone} /> : null}
        </View>
      )}

      {(isLeave ? r.reason : r.requestDetail) ? (
        <AppText variant="body" color="secondary">
          {isLeave ? r.reason : r.requestDetail}
        </AppText>
      ) : null}
      {isLeave && r.detail ? (
        <AppText variant="small" color="tertiary">
          {r.detail}
        </AppText>
      ) : null}

      {r.status === 'pending' ? (
        <View style={styles.actions}>
          <Button title="Reddet" icon="x" variant="dangerSoft" size="sm" style={styles.flex} onPress={onReject} />
          <Button title="Onayla" icon="check" size="sm" style={styles.flex} onPress={onApprove} />
        </View>
      ) : null}
    </View>
  );
}

const makeStyles = t => ({
  flex: { flex: 1 },
  controls: { paddingHorizontal: t.spacing.screen, gap: 12, marginBottom: 10 },
  list: { paddingHorizontal: t.spacing.screen, paddingBottom: 40 },
  card: {
    backgroundColor: t.colors.surface,
    borderRadius: t.radius.lg,
    borderWidth: 1,
    borderColor: t.colors.border,
    padding: 16,
    marginBottom: 12,
    gap: 10,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  leaveBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: t.colors.surfaceAlt,
    borderRadius: t.radius.md,
    padding: 12,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  actions: { flexDirection: 'row', gap: 10, paddingTop: 4 },
});
