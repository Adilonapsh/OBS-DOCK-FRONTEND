'use client';

/**
 * Registry panel kontrol dock. Cukup render `<ControlPanel id="poll" api={api} />`
 * dari dock mana pun - layout/penempatan diserahkan ke parent.
 */

import PollControl from './PollControl';
import TaskControl from './TaskControl';
import PinnedChatControl from './PinnedChatControl';
import GamesControl from './GamesControl';
import TimerControl from './TimerControl';
import ChatFeedControl from './ChatFeedControl';
import MusicControl from './MusicControl';
import type { DockControlsApi } from './types';

export const DOCK_CONTROL_PANELS = [
  { id: 'poll', title: 'Poll' },
  { id: 'task', title: 'Task' },
  { id: 'pinned', title: 'Pinned' },
  { id: 'games', title: 'Games' },
  { id: 'timer', title: 'Timer' },
  { id: 'chatfeed', title: 'Chat Feed' },
  { id: 'bgm', title: 'Music' },
] as const;

export type DockControlPanelId = (typeof DOCK_CONTROL_PANELS)[number]['id'];

export function isDockControlPanel(id: string): id is DockControlPanelId {
  return DOCK_CONTROL_PANELS.some((p) => p.id === id);
}

export type ControlPanelProps = {
  id: string;
  api: DockControlsApi;
  privateKey?: string | null;
  /** Room efektif Music/BGM (bgmRoom || privateKey). */
  musicRoom?: string;
  /** Room BGM tersimpan (untuk form settings). */
  musicRoomId?: string;
  onSaveMusicRoom?: (nextRoom: string) => Promise<boolean> | boolean | void;
};

export default function ControlPanel({
  id,
  api,
  privateKey,
  musicRoom,
  musicRoomId,
  onSaveMusicRoom,
}: ControlPanelProps) {
  switch (id) {
    case 'poll':
      return <PollControl poll={api.poll} actions={api.pollActions} />;
    case 'task':
      return <TaskControl tasks={api.tasks} actions={api.taskActions} />;
    case 'pinned':
      return <PinnedChatControl pinnedChat={api.pinnedChat} chat={api.chat} actions={api.pinActions} />;
    case 'games':
      return <GamesControl game={api.game} actions={api.gameActions} privateKey={privateKey} />;
    case 'timer':
      return <TimerControl timer={api.timer} actions={api.timerActions} />;
    case 'chatfeed':
      return <ChatFeedControl chat={api.chat} actions={api.pinActions} speakActions={api.speakActions} connected={api.connected} />;
    case 'bgm':
    case 'music':
      return (
        <MusicControl
          room={musicRoom || ''}
          roomId={musicRoomId}
          onSaveRoom={onSaveMusicRoom}
        />
      );
    default:
      return null;
  }
}

export { PollControl, TaskControl, PinnedChatControl, GamesControl, TimerControl, ChatFeedControl, MusicControl };
export type { DockControlsApi };
