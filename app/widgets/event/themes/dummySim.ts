'use client';
import { DEMO_EVENTS } from '../config';
import type { EventItem } from './types';
import type { DummyBase } from '../../_shared/hooks/useDummySimulation';

// Pool dummy event - mengalir satu per satu seperti real (join/gift/like campur).
const EXTRA_DUMMIES: DummyBase<EventItem>[] = [
  { type: 'join', nickname: 'DewiYT', platform: 'youtube', label: 'new member', profilePictureUrl: 'https://ui-avatars.com/api/?name=Dewi&background=ff0000&color=fff' },
  { type: 'gift', nickname: 'KickRider', platform: 'kick', giftName: 'GG', repeatCount: 2, diamondCount: 10, profilePictureUrl: 'https://ui-avatars.com/api/?name=Kick&background=53fc18&color=000' },
  { type: 'like', nickname: 'SariLive', platform: 'tiktok', likeCount: 28, profilePictureUrl: 'https://ui-avatars.com/api/?name=Sari&background=FE2C55&color=fff' },
  { type: 'join', nickname: 'NeonPilot', platform: 'twitch', label: 'subscribed', profilePictureUrl: 'https://ui-avatars.com/api/?name=Neon&background=9146ff&color=fff' },
  { type: 'gift', nickname: 'HambaAllah', platform: 'saweria', giftName: 'Donasi Rp 25.000', repeatCount: 1, diamondCount: 25000, message: 'Semangat terus bang!', amount: 25000, currency: 'IDR', profilePictureUrl: 'https://ui-avatars.com/api/?name=Hamba&background=f59e0b&color=fff' },
];

export const SIM_EVENT_POOL: DummyBase<EventItem>[] = [
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ...DEMO_EVENTS.map(({ id, timestamp, ...rest }) => rest),
  ...EXTRA_DUMMIES,
];
