/**
 * Auto Apply Settings — extension screen reusing the app design system
 * (GlassCard, Theme, Colors, lucide icons). No existing screen is modified.
 */
import { GlassCard } from '@/components/glass-card';
import {
  AUTO_APPLY_DISCLOSURE,
  EXPERIENCE_LEVELS,
  WORK_MODES,
  type WorkMode,
} from '@/constants/autoApply';
import { Colors, Theme } from '@/constants/theme';
import { useAutoApplySettings } from '@/hooks/use-auto-apply';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useRouter } from 'expo-router';
import {
  BellRing,
  Briefcase,
  ChevronLeft,
  MapPin,
  Pause,
  Play,
  Power,
  SlidersHorizontal,
  Wallet,
  Zap,
} from 'lucide-react-native';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const MATCH_STEPS = [50, 60, 70, 80, 90];

export default function AutoApplySettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;

  const { settings, loading, saving, update, toggleEnabled } =
    useAutoApplySettings();
  const [locationDraft, setLocationDraft] = useState('');

  const save = async (patch: Parameters<typeof update>[0], onError?: () => void) => {
    try {
      await update(patch);
    } catch {
      Alert.alert('Save failed', 'Check your connection and try again.');
      onError?.();
    }
  };

  const toggleMode = (mode: WorkMode) => {
    const has = settings.workModes.includes(mode);
    const next = has
      ? settings.workModes.filter((m) => m !== mode)
      : [...settings.workModes, mode];
    if (next.length === 0) return; // Keep at least one mode.
    save({ workModes: next });
  };

  const addLocation = () => {
    const v = locationDraft.trim();
    if (!v) return;
    if (settings.locations.some((l) => l.toLowerCase() === v.toLowerCase())) {
      setLocationDraft('');
      return;
    }
    save({ locations: [...settings.locations, v] });
    setLocationDraft('');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Auto Apply
        </Text>
        <View style={{ width: 44 }} />
      </View>

      {loading ? (
        <ActivityIndicator
          color={Theme.colors.primary}
          size="large"
          style={{ marginTop: 80 }}
        />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.body}
        >
          {/* Master toggle */}
          <GlassCard
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.glassBorder },
            ]}
          >
            <View style={styles.rowBetween}>
              <View style={[styles.iconBox, { backgroundColor: Theme.colors.primary + '15' }]}>
                <Zap size={20} color={Theme.colors.primary} fill={Theme.colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>
                  Auto Apply
                </Text>
                <Text style={[styles.cardSub, { color: colors.textMuted }]}>
                  {settings.enabled ? 'ON — processing matches' : 'OFF'}
                  {saving ? ' • saving…' : ''}
                </Text>
              </View>
              <Switch
                value={settings.enabled}
                onValueChange={(on) => save({ enabled: on, paused: on ? false : settings.paused })}
                trackColor={{ true: Theme.colors.primary }}
              />
            </View>
            <Text style={[styles.disclosure, { color: colors.textMuted }]}>
              {AUTO_APPLY_DISCLOSURE}
            </Text>
            {settings.enabled && (
              <View style={styles.pauseRow}>
                <TouchableOpacity
                  style={[
                    styles.pauseBtn,
                    {
                      backgroundColor: settings.paused
                        ? Theme.colors.primary
                        : colors.background,
                      borderColor: colors.glassBorder,
                    },
                  ]}
                  onPress={() => save({ paused: !settings.paused })}
                >
                  {settings.paused ? (
                    <Play size={14} color="#000" />
                  ) : (
                    <Pause size={14} color={colors.text} />
                  )}
                  <Text
                    style={[
                      styles.pauseText,
                      { color: settings.paused ? '#000' : colors.text },
                    ]}
                  >
                    {settings.paused ? 'Resume Auto Apply' : 'Pause Auto Apply'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.pauseBtn, styles.disableBtn]}
                  onPress={() => toggleEnabled(false)}
                >
                  <Power size={14} color="#fff" />
                  <Text style={[styles.pauseText, { color: '#fff' }]}>Disable</Text>
                </TouchableOpacity>
              </View>
            )}
          </GlassCard>

          {/* Roles (mirrored from profile) */}
          <GlassCard
            style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.glassBorder }]}
          >
            <View style={styles.sectionHead}>
              <Briefcase size={16} color={Theme.colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Preferred roles ({settings.roles.length}/3)
              </Text>
            </View>
            {settings.roles.length > 0 ? (
              <View style={styles.chipWrap}>
                {settings.roles.map((r) => (
                  <View key={r} style={[styles.chip, { backgroundColor: Theme.colors.primary + '15' }]}>
                    <Text style={[styles.chipText, { color: Theme.colors.primary }]}>{r}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={[styles.cardSub, { color: colors.textMuted }]}>
                No roles yet — add them during onboarding or in Profile.
              </Text>
            )}
            <TouchableOpacity onPress={() => router.push('/(tabs)/profile')}>
              <Text style={styles.link}>Edit roles in Profile</Text>
            </TouchableOpacity>
          </GlassCard>

          {/* Minimum match */}
          <GlassCard
            style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.glassBorder }]}
          >
            <View style={styles.sectionHead}>
              <SlidersHorizontal size={16} color={Theme.colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Minimum match: {settings.minMatch}%
              </Text>
            </View>
            <Text style={[styles.cardSub, { color: colors.textMuted }]}>
              Jobs scoring below this are skipped.
            </Text>
            <View style={styles.chipWrap}>
              {MATCH_STEPS.map((m) => (
                <TouchableOpacity
                  key={m}
                  style={[
                    styles.stepChip,
                    {
                      backgroundColor:
                        settings.minMatch === m ? Theme.colors.primary : colors.background,
                      borderColor: colors.glassBorder,
                    },
                  ]}
                  onPress={() => save({ minMatch: m })}
                >
                  <Text
                    style={[
                      styles.stepText,
                      { color: settings.minMatch === m ? '#000' : colors.text },
                    ]}
                  >
                    {m}%
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </GlassCard>

          {/* Locations */}
          <GlassCard
            style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.glassBorder }]}
          >
            <View style={styles.sectionHead}>
              <MapPin size={16} color={Theme.colors.secondary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Locations</Text>
            </View>
            <View style={styles.chipWrap}>
              {settings.locations.map((l) => (
                <TouchableOpacity
                  key={l}
                  style={[styles.chip, { backgroundColor: Theme.colors.secondary + '15' }]}
                  onPress={() =>
                    save({ locations: settings.locations.filter((x) => x !== l) })
                  }
                >
                  <Text style={[styles.chipText, { color: Theme.colors.secondary }]}>
                    {l} ✕
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={[styles.inputRow, { borderColor: colors.glassBorder }]}>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                value={locationDraft}
                onChangeText={setLocationDraft}
                placeholder="Add city, e.g. Chennai"
                placeholderTextColor={colors.textMuted}
                returnKeyType="done"
                onSubmitEditing={addLocation}
              />
              <TouchableOpacity
                style={[styles.addBtn, { backgroundColor: Theme.colors.primary }]}
                onPress={addLocation}
              >
                <Text style={styles.addBtnText}>Add</Text>
              </TouchableOpacity>
            </View>
          </GlassCard>

          {/* Work modes */}
          <GlassCard
            style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.glassBorder }]}
          >
            <View style={styles.sectionHead}>
              <BellRing size={16} color={Theme.colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Remote / Hybrid / On-site
              </Text>
            </View>
            <View style={styles.chipWrap}>
              {WORK_MODES.map((m) => {
                const on = settings.workModes.includes(m);
                return (
                  <TouchableOpacity
                    key={m}
                    style={[
                      styles.stepChip,
                      {
                        backgroundColor: on ? Theme.colors.primary : colors.background,
                        borderColor: colors.glassBorder,
                      },
                    ]}
                    onPress={() => toggleMode(m)}
                  >
                    <Text style={[styles.stepText, { color: on ? '#000' : colors.text }]}>
                      {m}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </GlassCard>

          {/* Salary + experience */}
          <GlassCard
            style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.glassBorder }]}
          >
            <View style={styles.sectionHead}>
              <Wallet size={16} color={Theme.colors.secondary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Salary floor & experience
              </Text>
            </View>
            <TextInput
              style={[styles.salaryInput, { color: colors.text, borderColor: colors.glassBorder }]}
              value={settings.salaryMin}
              onChangeText={(t) => save({ salaryMin: t })}
              placeholder="e.g. 6 (LPA) — optional"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
            />
            <View style={styles.chipWrap}>
              {EXPERIENCE_LEVELS.map((level) => {
                const on = settings.experienceLevel === level;
                return (
                  <TouchableOpacity
                    key={level}
                    style={[
                      styles.stepChip,
                      {
                        backgroundColor: on ? Theme.colors.primary : colors.background,
                        borderColor: colors.glassBorder,
                      },
                    ]}
                    onPress={() => save({ experienceLevel: level })}
                  >
                    <Text style={[styles.stepText, { color: on ? '#000' : colors.text }]}>
                      {level}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </GlassCard>

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '900' },
  body: { paddingHorizontal: 20, paddingBottom: 40 },
  card: { borderRadius: 20, padding: 16, borderWidth: 1.2, marginBottom: 14 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: { fontSize: 16, fontWeight: '800' },
  cardSub: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  disclosure: { fontSize: 12, lineHeight: 18, marginTop: 12 },
  pauseRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  pauseBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: 13,
    borderWidth: 1.2,
  },
  disableBtn: { backgroundColor: '#ef4444', borderColor: '#ef4444', flex: 0.7 },
  pauseText: { fontSize: 12, fontWeight: '800' },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  sectionTitle: { fontSize: 14, fontWeight: '800' },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 12 },
  chipText: { fontSize: 12, fontWeight: '700' },
  link: { color: Theme.colors.primary, fontWeight: '700', fontSize: 13, marginTop: 10 },
  stepChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1.2,
  },
  stepText: { fontSize: 12, fontWeight: '800' },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    borderWidth: 1.2,
    borderRadius: 14,
    padding: 6,
    paddingLeft: 12,
    alignItems: 'center',
  },
  input: { flex: 1, fontSize: 14, fontWeight: '600' },
  addBtn: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10 },
  addBtnText: { color: '#000', fontWeight: '800', fontSize: 13 },
  salaryInput: {
    borderWidth: 1.2,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
  },
});
