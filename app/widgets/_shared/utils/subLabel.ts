// Label ramah untuk event follow/subscribe dari Streamer.bot.
// Dipakai widget event + follow agar Sub/ReSub/Member dll tampil
// dengan teks yang benar, bukan sekadar "followed"/"joined".
//
// Sumber event (nama persis dari docs Streamer.bot):
// - Twitch: Follow, Sub, ReSub, GiftPaidUpgrade, PrimePaidUpgrade
// - YouTube: NewSponsor, MembershipGift, GiftMembershipReceived,
//   MemberMileStone, NewSubscriber
// - Kick: Follow, Subscription, Resubscription

// Tipe display yang dianggap follow/subscribe (muncul di widget follow,
// dan di widget event sebagai join berlabel — bukan join biasa).
const FOLLOW_TYPES = new Set([
  'follow',
  'sub',
  'subscription',
  'newsubscriber',
  'resub',
  'resubscription',
  'membermilestone',
  'newsponsor',
  'membershipgift',
  'giftmembershipreceived',
  'giftpaidupgrade',
  'primepaidupgrade',
]);

export function isFollowDisplayType(displayType: unknown): boolean {
  const t = String(displayType || '').trim().toLowerCase();
  return t !== '' && FOLLOW_TYPES.has(t);
}

export type SubDetail = {
  count?: unknown;
  months?: unknown;
};

function num(v: unknown): number {
  const x = Number(v);
  return Number.isFinite(x) && x > 0 ? Math.floor(x) : 0;
}

// "Sub" → "subscribed", "ReSub" (+3 bulan) → "resubscribed • 3 mo", dst.
// Fallback: tipe asli lowercase, atau 'followed' bila kosong.
export function subLabelFor(displayType: unknown, detail?: SubDetail): string {
  const t = String(displayType || '').trim().toLowerCase();
  switch (t) {
    case 'follow':
      return 'followed';
    case 'sub':
    case 'subscription':
    case 'newsubscriber':
      return 'subscribed';
    case 'resub':
    case 'resubscription':
    case 'membermilestone': {
      const m = num(detail?.months);
      return m > 0 ? `resubscribed • ${m} mo` : 'resubscribed';
    }
    case 'newsponsor':
      return 'new member';
    case 'membershipgift': {
      const c = num(detail?.count);
      return c > 0 ? `gifted ${c} memberships` : 'gifted memberships';
    }
    case 'giftmembershipreceived':
      return 'got gifted membership';
    case 'giftpaidupgrade':
    case 'primepaidupgrade':
      return 'upgraded sub';
    default:
      return t || 'followed';
  }
}
