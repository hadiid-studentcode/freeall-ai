/**
 * Diagram alur sistem.
 *
 * Digambar sebagai SVG sebaris, bukan lewat pustaka diagram, karena:
 * - tidak menambah dependensi dan tetap ter-render di server;
 * - warnanya memakai variabel tema yang sama dengan seluruh aplikasi,
 *   sehingga otomatis ikut kalau temanya berubah;
 * - `viewBox` membuatnya menyesuaikan lebar layar tanpa gambar pecah.
 */

import type { Dictionary } from "@/lib/i18n";

/** Teks diagram dioper dari halaman supaya ikut bahasa pilihan pengunjung. */
type DiagramCopy = Dictionary["docs"]["diagrams"];

const STROKE = "var(--border)";
const MUTED = "var(--muted-foreground)";
const FG = "var(--foreground)";
const PRIMARY = "var(--primary)";
const DANGER = "var(--destructive)";
const CARD = "var(--card)";

/** Pembungkus supaya diagram lebar tetap bisa digulir di layar sempit. */
function Frame({
  children,
  viewBox,
  label,
}: {
  children: React.ReactNode;
  viewBox: string;
  label: string;
}) {
  return (
    <div className="overflow-x-auto scrollbar-thin">
      <svg
        viewBox={viewBox}
        role="img"
        aria-label={label}
        className="h-auto w-full min-w-[640px]"
      >
        {children}
      </svg>
    </div>
  );
}

function Box({
  x,
  y,
  w = 150,
  h = 58,
  title,
  subtitle,
  accent = false,
}: {
  x: number;
  y: number;
  w?: number;
  h?: number;
  title: string;
  subtitle?: string;
  accent?: boolean;
}) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={10}
        fill={CARD}
        stroke={accent ? PRIMARY : STROKE}
        strokeWidth={accent ? 1.5 : 1}
      />
      <text
        x={x + w / 2}
        y={subtitle ? y + h / 2 - 4 : y + h / 2 + 4}
        textAnchor="middle"
        fontSize="13"
        fontWeight="600"
        fill={accent ? PRIMARY : FG}
      >
        {title}
      </text>
      {subtitle && (
        <text
          x={x + w / 2}
          y={y + h / 2 + 14}
          textAnchor="middle"
          fontSize="11"
          fill={MUTED}
        >
          {subtitle}
        </text>
      )}
    </g>
  );
}

function Arrow({
  x1,
  y1,
  x2,
  y2,
  label,
  color = MUTED,
  dashed = false,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  label?: string;
  color?: string;
  dashed?: boolean;
}) {
  const id = `head-${x1}-${y1}-${x2}-${y2}`.replace(/\./g, "_");
  return (
    <g>
      <defs>
        <marker
          id={id}
          markerWidth="8"
          markerHeight="8"
          refX="7"
          refY="3"
          orient="auto"
        >
          <path d="M0,0 L0,6 L7,3 z" fill={color} />
        </marker>
      </defs>
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={color}
        strokeWidth="1.5"
        strokeDasharray={dashed ? "4 4" : undefined}
        markerEnd={`url(#${id})`}
      />
      {label && (
        <text
          x={(x1 + x2) / 2}
          y={y1 === y2 ? y1 - 8 : (y1 + y2) / 2 - 6}
          textAnchor="middle"
          fontSize="10"
          fill={color}
        >
          {label}
        </text>
      )}
    </g>
  );
}

/* -------------------------------------------------------------------------- */

/** Alur satu request dari aplikasi klien sampai kembali membawa jawaban. */
export function RequestFlowDiagram({ t }: { t: DiagramCopy }) {
  return (
    <Frame viewBox="0 0 940 260" label={t.flowLabel}>
      <Box x={10} y={40} title={t.flowApp} subtitle={t.flowAppSub} />
      <Arrow x1={162} y1={69} x2={198} y2={69} />

      <Box x={200} y={40} title={t.flowAuth} subtitle={t.flowAuthSub} />
      <Arrow x1={352} y1={69} x2={388} y2={69} />

      <Box x={390} y={40} title={t.flowLimit} subtitle={t.flowLimitSub} />
      <Arrow x1={542} y1={69} x2={578} y2={69} />

      <Box
        x={580}
        y={40}
        title="AiManager"
        subtitle={t.flowManagerSub}
        accent
      />
      <Arrow x1={732} y1={69} x2={768} y2={69} />

      <Box x={770} y={40} w={160} title={t.flowProvider} subtitle="Groq, Gemini…" />

      {/* Jalur balik */}
      <Arrow
        x1={850}
        y1={100}
        x2={850}
        y2={150}
        color={PRIMARY}
      />
      <Arrow
        x1={848}
        y1={168}
        x2={168}
        y2={168}
        color={PRIMARY}
        label={t.flowAnswer}
      />
      <Arrow x1={85} y1={150} x2={85} y2={102} color={PRIMARY} />

      {/* Pencatatan */}
      <Arrow x1={656} y1={100} x2={656} y2={196} dashed />
      <Box
        x={580}
        y={198}
        title="RequestLog"
        subtitle={t.flowLogSub}
        h={50}
      />
    </Frame>
  );
}

/** Fallback berlapis: model dulu, baru pindah kunci. */
export function FallbackDiagram({ t }: { t: DiagramCopy }) {
  return (
    <Frame viewBox="0 0 940 330" label={t.fallbackLabel}>
      {/* Kunci 1 */}
      <rect
        x={10}
        y={10}
        width={430}
        height={220}
        rx={12}
        fill="none"
        stroke={STROKE}
        strokeDasharray="5 5"
      />
      <text x={26} y={34} fontSize="12" fontWeight="600" fill={MUTED}>
        {t.fallbackKey1}
      </text>

      <Box x={30} y={50} w={180} title={t.fallbackPrimary} subtitle="gemini-flash" />
      <text x={230} y={75} fontSize="12" fill={DANGER}>
        {t.fallbackQuotaGone}
      </text>
      <Arrow x1={120} y1={110} x2={120} y2={144} color={DANGER} />

      <Box x={30} y={146} w={180} title={t.fallbackBackup} subtitle="flash-lite" />
      <text x={230} y={172} fontSize="12" fill={DANGER}>
        {t.fallbackQuotaGone}
      </text>

      <Arrow
        x1={225}
        y1={175}
        x2={480}
        y2={175}
        color={MUTED}
        label={t.fallbackSwitchKey}
      />

      {/* Kunci 2 */}
      <rect
        x={490}
        y={10}
        width={430}
        height={220}
        rx={12}
        fill="none"
        stroke={PRIMARY}
        strokeDasharray="5 5"
      />
      <text x={506} y={34} fontSize="12" fontWeight="600" fill={MUTED}>
        {t.fallbackKey2}
      </text>

      <Box
        x={510}
        y={146}
        w={180}
        title={t.fallbackPrimary}
        subtitle="llama-3.1-8b"
        accent
      />
      <text x={710} y={172} fontSize="12" fill={PRIMARY}>
        {t.fallbackSuccess}
      </text>

      <Arrow x1={600} y1={210} x2={600} y2={258} color={PRIMARY} />
      <Box
        x={470}
        y={260}
        w={260}
        h={50}
        title={t.fallbackDelivered}
        subtitle="attempts: 3"
        accent
      />
    </Frame>
  );
}

/** Siapa boleh memakai kunci siapa. */
export function KeyScopeDiagram({ t }: { t: DiagramCopy }) {
  return (
    <Frame viewBox="0 0 940 260" label={t.scopeLabel}>
      <Box x={10} y={30} w={170} title={t.scopeUserA} subtitle={t.scopeUserASub} />
      <Box
        x={10}
        y={150}
        w={170}
        title={t.scopeVisitor}
        subtitle={t.scopeVisitorSub}
      />

      <Arrow x1={182} y1={59} x2={318} y2={59} label={t.scopeTriedFirst} />
      <Box
        x={320}
        y={30}
        w={200}
        title={t.scopePrivateKey}
        subtitle={t.scopePrivateKeySub}
        accent
      />

      <Arrow x1={522} y1={59} x2={658} y2={70} label={t.scopeWhenExhausted} />
      <Arrow x1={182} y1={172} x2={658} y2={110} label={t.scopeOnlyThis} />

      <Box
        x={660}
        y={60}
        w={260}
        h={70}
        title={t.scopePublic}
        subtitle={t.scopePublicSub}
      />

      <text x={320} y={185} fontSize="12" fill={MUTED}>
        {t.scopeNote1}
      </text>
      <text x={320} y={205} fontSize="12" fill={MUTED}>
        {t.scopeNote2}
      </text>
    </Frame>
  );
}
