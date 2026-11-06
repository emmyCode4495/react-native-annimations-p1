import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { brand } from '../brand';
import { Avatar } from '../components/Avatar';
import { BottomSheet } from '../components/BottomSheet';
import { BudgetRing } from '../components/BudgetRing';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { GlowInput } from '../components/GlowInput';
import { Icon, IconName } from '../components/Icon';
import { PressableScale } from '../components/PressableScale';
import { PrimaryButton } from '../components/PrimaryButton';
import { Toggle } from '../components/Toggle';
import { useToast } from '../components/Toast';
import { Settings, useWallet } from '../wallet-store';

const c = brand.colors;

const CHECKS = [
  { label: 'Email verified', done: true },
  { label: 'Phone number added', done: true },
  { label: 'ID verified', done: true },
  { label: 'Add a backup contact', done: false },
];

function Row({ icon, title, sub, right, onPress, tint = c.accent }: { icon: IconName; title: string; sub?: string; right: React.ReactNode; onPress?: () => void; tint?: string }) {
  const body = (
    <View style={styles.row}>
      <View style={[styles.rowIcon, { backgroundColor: tint + '1F' }]}>
        <Icon name={icon} size={22} color={tint} />
      </View>
      <View style={styles.flex}>
        <Text style={[styles.rowTitle, tint === c.danger && { color: c.danger }]}>{title}</Text>
        {sub ? <Text style={styles.rowSub}>{sub}</Text> : null}
      </View>
      {right}
    </View>
  );
  return onPress ? (
    <PressableScale haptic scaleTo={0.98} onPress={onPress} accessibilityLabel={title}>
      {body}
    </PressableScale>
  ) : (
    body
  );
}

function Group({ title, delay, children }: { title: string; delay: number; children: React.ReactNode }) {
  return (
    <Animated.View entering={FadeInDown.delay(delay).springify().damping(16)} style={styles.groupWrap}>
      <Text style={styles.groupTitle}>{title}</Text>
      <View style={styles.group}>{children}</View>
    </Animated.View>
  );
}

export function MeTab() {
  const insets = useSafeAreaInsets();
  const { profile, settings, setSetting, setProfile } = useWallet();
  const { show, node } = useToast();
  const [editOpen, setEditOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [draftErr, setDraftErr] = useState<string | null>(null);
  const [logoutOpen, setLogoutOpen] = useState(false);

  const name = profile.name || 'Guest';
  const first = name.split(' ')[0];

  const toggle = (key: keyof Settings, label: string, on: string, off: string) => (v: boolean) => {
    setSetting(key, v);
    show(`${label} ${v ? on : off}`);
  };

  const saveName = () => {
    if (draft.trim().length < 2) return setDraftErr('Enter at least 2 characters.');
    setProfile({ ...profile, name: draft.trim() });
    setEditOpen(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    show('Profile updated');
  };

  return (
    <View style={styles.screen}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 120, paddingHorizontal: 24 }}>
        <Animated.View entering={FadeIn.duration(400)} style={styles.head}>
          <View>
            <Avatar name={name} color={c.accent} size={72} solid />
            <Animated.View entering={ZoomIn.delay(500).springify().damping(10)} style={styles.verified}>
              <Icon name="check" size={14} color="white" />
            </Animated.View>
          </View>
          <View style={styles.flex}>
            <Text style={styles.name} numberOfLines={1}>
              {name}
            </Text>
            <Text style={styles.email} numberOfLines={1}>
              {profile.email || 'Verified account'}
            </Text>
          </View>
          <PressableScale
            haptic
            scaleTo={0.9}
            accessibilityLabel="Edit profile"
            style={styles.editBtn}
            onPress={() => {
              setDraft(profile.name);
              setDraftErr(null);
              setEditOpen(true);
            }}
          >
            <Icon name="edit" size={20} color={c.text} />
          </PressableScale>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(120).springify().damping(16)} style={styles.strength}>
          <BudgetRing size={92} progress={0.75} delay={500} label="complete" />
          <View style={styles.flex}>
            <Text style={styles.strTitle}>Profile strength</Text>
            {CHECKS.map((x) => (
              <View key={x.label} style={styles.check}>
                <Icon name={x.done ? 'check' : 'circle'} size={16} color={x.done ? c.success : c.muted} />
                <Text style={[styles.checkText, !x.done && { color: c.muted }]}>{x.label}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        <Group title="Security" delay={220}>
          <Row icon="lock" title="Biometric login" sub="Unlock with Face ID or fingerprint" right={<Toggle value={settings.biometric} onChange={toggle('biometric', 'Biometric login', 'on', 'off')} />} />
          <View style={styles.sep} />
          <Row icon="shield" title="Two-step verification" sub="Extra check when you sign in" right={<Toggle value={settings.twoFactor} onChange={toggle('twoFactor', 'Two-step verification', 'on', 'off')} />} />
        </Group>

        <Group title="Preferences" delay={300}>
          <Row icon="bell" title="Notifications" sub="Payments and security alerts" right={<Toggle value={settings.notifications} onChange={toggle('notifications', 'Notifications', 'on', 'off')} />} />
          <View style={styles.sep} />
          <Row icon="eyeoff" title="Hide balance" sub="Mask your balance on Home" right={<Toggle value={settings.hideBalance} onChange={toggle('hideBalance', 'Balance', 'hidden', 'visible')} />} />
        </Group>

        <Group title="Support" delay={380}>
          <Row
            icon="mail"
            title="Contact support"
            sub="We usually reply within a day"
            right={<Icon name="chevron" size={20} color={c.muted} />}
            onPress={() => Linking.openURL('mailto:hello@tallyo.example').catch(() => show('No mail app found'))}
          />
          <View style={styles.sep} />
          <Row icon="logout" title="Log out" tint={c.danger} right={<Icon name="chevron" size={20} color={c.danger} />} onPress={() => setLogoutOpen(true)} />
        </Group>

        <Animated.Text entering={FadeIn.delay(600)} style={styles.version}>
          Tallyo 1.0, demo build
        </Animated.Text>
      </ScrollView>

      {node}

      <BottomSheet visible={editOpen} title="Edit profile" onClose={() => setEditOpen(false)}>
        <GlowInput
          label="Full name"
          value={draft}
          onChangeText={(t) => {
            setDraft(t);
            if (draftErr) setDraftErr(null);
          }}
          error={draftErr}
          autoCapitalize="words"
          returnKeyType="done"
        />
        <View style={{ height: 8 }} />
        <PrimaryButton label="Save changes" onPress={saveName} />
      </BottomSheet>

      <ConfirmDialog
        visible={logoutOpen}
        tone="danger"
        icon="logout"
        title="Log out of Tallyo?"
        message={`${first}, you'll need to sign in again to see your cards and balance.`}
        confirmLabel="Log out"
        onConfirm={() => {
          setLogoutOpen(false);
          router.replace('/auth');
        }}
        onCancel={() => setLogoutOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.ink },
  flex: { flex: 1 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  verified: { position: 'absolute', right: -2, bottom: -2, width: 26, height: 26, borderRadius: 13, backgroundColor: c.success, borderWidth: 3, borderColor: c.ink, alignItems: 'center', justifyContent: 'center' },
  name: { color: c.text, fontSize: 24, fontWeight: '800', letterSpacing: -0.6 },
  email: { color: c.muted, fontSize: 14, marginTop: 3 },
  editBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: c.card, borderWidth: 1, borderColor: c.stroke, alignItems: 'center', justifyContent: 'center' },
  strength: { flexDirection: 'row', alignItems: 'center', gap: 18, marginTop: 24, padding: 18, borderRadius: 26, backgroundColor: c.card, borderWidth: 1, borderColor: c.stroke },
  strTitle: { color: c.text, fontSize: 17, fontWeight: '800', marginBottom: 8 },
  check: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 3 },
  checkText: { color: c.text, fontSize: 13, fontWeight: '600' },
  groupWrap: { marginTop: 24 },
  groupTitle: { color: c.muted, fontSize: 13, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 10, marginLeft: 4 },
  group: { padding: 14, borderRadius: 26, backgroundColor: c.card, borderWidth: 1, borderColor: c.stroke },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 4 },
  rowIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { color: c.text, fontSize: 16, fontWeight: '700' },
  rowSub: { color: c.muted, fontSize: 13, marginTop: 2 },
  sep: { height: StyleSheet.hairlineWidth, backgroundColor: c.stroke, marginVertical: 12, marginLeft: 58 },
  version: { color: c.muted, fontSize: 13, textAlign: 'center', marginTop: 28 },
});
