'use client';
import { DEMO_FOLLOWS } from '../config';
import type { FollowItem } from './types';
import type { DummyBase } from '../../_shared/hooks/useDummySimulation';

// Pool dummy follow — mengalir satu per satu seperti real.
const EXTRA_DUMMIES: DummyBase<FollowItem>[] = [
  { nickname: 'DewiYT', platform: 'youtube', label: 'new subscriber', profilePictureUrl: 'https://ui-avatars.com/api/?name=Dewi&background=ff0000&color=fff' },
  { nickname: 'KickRider', platform: 'kick', profilePictureUrl: 'https://ui-avatars.com/api/?name=Kick&background=53fc18&color=000' },
  { nickname: 'NeonPilot', platform: 'twitch', label: 'subscribed', profilePictureUrl: 'https://ui-avatars.com/api/?name=Neon&background=9146ff&color=fff' },
  { nickname: 'SariLive', platform: 'tiktok', profilePictureUrl: 'https://ui-avatars.com/api/?name=Sari&background=FE2C55&color=fff' },
];

export const SIM_FOLLOW_POOL: DummyBase<FollowItem>[] = [
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ...DEMO_FOLLOWS.map(({ id, timestamp, ...rest }) => rest),
  ...EXTRA_DUMMIES,
];
