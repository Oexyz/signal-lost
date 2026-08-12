import {
  type MouseEvent,
  type PropsWithChildren,
  useEffect,
  useReducer,
  useRef,
  useState,
} from "react";

type RoutePath =
  | "/"
  | "/play"
  | "/about"
  | "/devlog"
  | "/support"
  | "/security";

type Perspective = "operations" | "archives";

const routeTitles: Record<RoutePath, string> = {
  "/": "SIGNAL//LOST",
  "/play": "Protocol Test // SIGNAL//LOST",
  "/about": "About // SIGNAL//LOST",
  "/devlog": "Devlog // SIGNAL//LOST",
  "/support": "Support // SIGNAL//LOST",
  "/security": "Security // SIGNAL//LOST",
};

const knownRoutes = new Set<RoutePath>(Object.keys(routeTitles) as RoutePath[]);

function normalisePath(path: string): string {
  if (path === "/") return path;
  return path.replace(/\/+$/, "") || "/";
}

function useRoute(): string {
  const [path, setPath] = useState(() => normalisePath(window.location.pathname));

  useEffect(() => {
    const updatePath = () => setPath(normalisePath(window.location.pathname));
    window.addEventListener("popstate", updatePath);
    window.addEventListener("signal-lost:navigate", updatePath);
    return () => {
      window.removeEventListener("popstate", updatePath);
      window.removeEventListener("signal-lost:navigate", updatePath);
    };
  }, []);

  return path;
}

function navigate(event: MouseEvent<HTMLAnchorElement>, href: RoutePath): void {
  if (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  ) {
    return;
  }

  event.preventDefault();
  window.history.pushState(null, "", href);
  window.dispatchEvent(new Event("signal-lost:navigate"));
  window.scrollTo({ top: 0, behavior: "instant" });
}

function Link({
  href,
  className,
  ariaCurrent,
  children,
}: PropsWithChildren<{
  href: RoutePath;
  className?: string;
  ariaCurrent?: "page";
}>) {
  return (
    <a
      aria-current={ariaCurrent}
      className={className}
      href={href}
      onClick={(event) => navigate(event, href)}
    >
      {children}
    </a>
  );
}

function BrandMark() {
  return (
    <span className="brand-mark" aria-label="SIGNAL//LOST">
      <span>SIGNAL</span>
      <i aria-hidden="true">//</i>
      <span>LOST</span>
    </span>
  );
}

function Header({ path }: { path: string }) {
  const navigation: Array<[RoutePath, string]> = [
    ["/play", "Protocol test"],
    ["/about", "About"],
    ["/devlog", "Devlog"],
    ["/support", "Support"],
    ["/security", "Security"],
  ];

  return (
    <header className="site-header">
      <Link href="/" className="brand-link">
        <BrandMark />
      </Link>
      <nav className="primary-nav" aria-label="Primary navigation">
        {navigation.map(([href, label]) => {
          const isCurrent = normalisePath(path) === href;

          return (
            <Link
              href={href}
              ariaCurrent={isCurrent ? "page" : undefined}
              className={isCurrent ? "is-active" : undefined}
              key={href}
            >
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="header-readout" aria-label="Development channel status">
        <span className="status-lamp" />
        <span>LOCAL BUILD</span>
        <strong>PHASE 0</strong>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="site-footer">
      <div>
        <BrandMark />
        <p>SAME STATION. DIFFERENT TRUTH.</p>
      </div>
      <div className="footer-status" aria-label="Build status">
        <span>PHASE 0</span>
        <span>PROTOCOL SURFACE</span>
        <span>NO TELEMETRY</span>
      </div>
      <nav aria-label="Legal information">
        <a href="/impressum">Impressum</a>
        <a href="/datenschutz">Datenschutz</a>
      </nav>
    </footer>
  );
}

function SignalField() {
  return (
    <div className="signal-field" aria-hidden="true">
      <div className="orbital orbital-a" />
      <div className="orbital orbital-b" />
      <div className="station-core">
        <span>O-17</span>
      </div>
      <div className="signal-vector vector-a" />
      <div className="signal-vector vector-b" />
      <div className="coordinate coordinate-a">03 / 17</div>
      <div className="coordinate coordinate-b">C03</div>
    </div>
  );
}

function LandingPage() {
  return (
    <main>
      <section className="hero grid-shell">
        <div className="hero-copy">
          <p className="eyebrow"><span>ORPHEUS-17</span> / PUBLIC SIGNAL</p>
          <h1 id="page-heading" tabIndex={-1}><BrandMark /></h1>
          <p className="core-promise">
            YOU ARE ALL LOOKING<br />
            AT THE SAME STATION.<br />
            <span>YOU ARE NOT SEEING</span><br />
            <span>THE SAME THING.</span>
          </p>
          <p className="hero-subline">A cooperative asymmetric mystery for 2–6 players.</p>
          <div className="hero-actions">
            <Link href="/play" className="button button-primary">
              <span>ENTER SIGNAL</span>
              <b aria-hidden="true">↗</b>
            </Link>
            <span className="release-stamp">PHASE 0 / LOCAL PROTOCOL TEST</span>
          </div>
        </div>
        <div className="hero-visual">
          <SignalField />
          <div className="visual-caption">
            <span>RECEIVER ARRAY / 03</span>
            <span>SIGNAL CONFIDENCE UNVERIFIED</span>
          </div>
        </div>
      </section>

      <section className="manifesto grid-shell section-rule" aria-labelledby="manifesto-title">
        <div className="section-index">01 / THE INCIDENT</div>
        <div>
          <h2 id="manifesto-title">One incident.<br />Restricted viewpoints.</h2>
        </div>
        <div className="manifesto-copy">
          <p>
            Every role receives a different operational surface. Evidence is incomplete by
            design. Progress begins when players describe what only they can see.
          </p>
          <p>
            SIGNAL//LOST is built around precise communication, disputed records, and the
            distance between a system state and its archived history.
          </p>
        </div>
      </section>

      <section className="role-section grid-shell section-rule" aria-labelledby="roles-title">
        <div className="section-index">02 / VIEWPOINTS</div>
        <div className="role-heading">
          <h2 id="roles-title">SAME STATION.<br /><span>DIFFERENT TRUTH.</span></h2>
          <p>Two Phase-0 surfaces are currently cleared for inspection.</p>
        </div>
        <div className="role-cards">
          <article className="role-card role-operations">
            <div className="role-card-top"><span>OPS</span><span>01</span></div>
            <h3>OPERATIONS</h3>
            <p>Live systems, control states, and the pressure to act before the picture is complete.</p>
            <div className="mini-schematic" aria-hidden="true"><i /><i /><i /></div>
          </article>
          <article className="role-card role-archives">
            <div className="role-card-top"><span>ARC</span><span>02</span></div>
            <h3>ARCHIVES</h3>
            <p>Indexed records, damaged context, and evidence that does not align with the present.</p>
            <div className="archive-lines" aria-hidden="true"><i /><i /><i /><i /></div>
          </article>
        </div>
      </section>

      <section className="entry-section section-rule">
        <div>
          <p className="eyebrow">LOCAL HANDOFF / C03</p>
          <h2>The first signal is open.</h2>
          <p>Inspect both client-safe perspectives in a one-device scenario preview.</p>
        </div>
        <Link href="/play" className="button button-primary button-large">
          <span>RUN C03 TEST</span><b aria-hidden="true">→</b>
        </Link>
      </section>
    </main>
  );
}

type DemoState = {
  recordRequested: boolean;
  recordTransmitted: boolean;
  crossCheckAccepted: boolean;
  sequence: number;
};

type DemoAction = "request" | "transmit" | "accept" | "reset";

const initialDemoState: DemoState = {
  recordRequested: false,
  recordTransmitted: false,
  crossCheckAccepted: false,
  sequence: 1,
};

function demoReducer(state: DemoState, action: DemoAction): DemoState {
  switch (action) {
    case "request":
      return state.recordRequested ? state : { ...state, recordRequested: true, sequence: state.sequence + 1 };
    case "transmit":
      return !state.recordRequested || state.recordTransmitted
        ? state
        : { ...state, recordTransmitted: true, sequence: state.sequence + 1 };
    case "accept":
      return !state.recordTransmitted || state.crossCheckAccepted
        ? state
        : { ...state, crossCheckAccepted: true, sequence: state.sequence + 1 };
    case "reset":
      return initialDemoState;
  }
}

function DemoTimeline({ state }: { state: DemoState }) {
  return (
    <ol className="relay-log" aria-live="polite">
      <li>
        <time>00:00</time>
        <span><b>SYSTEM</b> Local C03 protocol surface initialized.</span>
      </li>
      {state.recordRequested && (
        <li>
          <time>00:14</time>
          <span><b>OPERATIONS</b> Archive cross-check requested for DOOR C03.</span>
        </li>
      )}
      {state.recordTransmitted && (
        <li>
          <time>00:31</time>
          <span><b>ARCHIVES</b> Synthetic record AX-C03-7 transmitted.</span>
        </li>
      )}
      {state.crossCheckAccepted && (
        <li>
          <time>00:46</time>
          <span><b>OPERATIONS</b> Discrepancy acknowledged. Test sequence complete.</span>
        </li>
      )}
    </ol>
  );
}

function OperationsPanel({ state, dispatch }: { state: DemoState; dispatch: (action: DemoAction) => void }) {
  return (
    <section className="console-panel operations-console" aria-labelledby="operations-console-title">
      <div className="console-titlebar">
        <div><span>VIEW 01</span><h2 id="operations-console-title">OPERATIONS</h2></div>
        <span className="clearance">CONTROL / LIMITED</span>
      </div>
      <div className="metric-grid">
        <div><span>SYSTEM INTEGRITY</span><strong>UNVERIFIED</strong><i className="meter"><b style={{ width: "40%" }} /></i></div>
        <div><span>C03 INTERLOCK</span><strong className="amber">OPEN</strong><small>OPERATIONS PROJECTION</small></div>
        <div><span>STATION CLOCK</span><strong>00:42:17</strong><small>OFFSET NOT VERIFIED</small></div>
      </div>
      <div className="console-block">
        <div className="block-label"><span>DOOR C03 / CONTROL REVIEW</span><span>REF 03-C</span></div>
        <div className="door-schematic" aria-label="Operations reports Door C03 as open">
          <div className="door-half"><i /><i /><i /></div>
          <div className="door-seam"><span>C03</span></div>
          <div className="door-half"><i /><i /><i /></div>
        </div>
        <p className="console-note">
          Operations can read the live interlock, but cannot inspect the record attached to its last state change.
        </p>
      </div>
      <div className="action-rack">
        {!state.recordRequested && (
          <button className="console-action" type="button" onClick={() => dispatch("request")}>
            <span>01</span><b>REQUEST ARCHIVE CROSS-CHECK</b><i>Send to shared relay →</i>
          </button>
        )}
        {state.recordRequested && !state.recordTransmitted && (
          <div className="awaiting"><span className="status-lamp" /> AWAITING ARCHIVES RESPONSE</div>
        )}
        {state.recordTransmitted && !state.crossCheckAccepted && (
          <button className="console-action action-confirm" type="button" onClick={() => dispatch("accept")}>
            <span>03</span><b>ACKNOWLEDGE DISCREPANCY</b><i>Close test sequence →</i>
          </button>
        )}
        {state.crossCheckAccepted && <div className="complete-mark">C03 PROTOCOL SEQUENCE / COMPLETE</div>}
      </div>
    </section>
  );
}

function ArchivesPanel({ state, dispatch }: { state: DemoState; dispatch: (action: DemoAction) => void }) {
  return (
    <section className="console-panel archives-console" aria-labelledby="archives-console-title">
      <div className="console-titlebar">
        <div><span>VIEW 02</span><h2 id="archives-console-title">ARCHIVES</h2></div>
        <span className="clearance">INDEX / READ ONLY</span>
      </div>
      <div className="archive-query">
        <span>INDEX QUERY</span>
        <strong>ORPHEUS-17 / ACCESS / C03</strong>
        <i>1 ROLE-SAFE RECORD LOCATED</i>
      </div>
      <article className="record-sheet">
        <header><span>AX-C03-7</span><span>ARCHIVES PROJECTION</span></header>
        <dl>
          <div><dt>SUBJECT</dt><dd>DOOR C03 / SEALED SINCE 11 YEARS</dd></div>
          <div><dt>RECORD CLOCK</dt><dd>00:39:02</dd></div>
          <div><dt>CAPTURE CLOCK</dt><dd className="redacted">00:4█:17</dd></div>
          <div><dt>INDEX NOTE</dt><dd>TIMESTAMP FIELDS DO NOT ALIGN</dd></div>
        </dl>
        <p>
          Archives can inspect the indexed discrepancy, but cannot see whether the physical interlock is currently open or sealed.
        </p>
      </article>
      <div className="action-rack">
        {!state.recordRequested && <div className="awaiting muted">NO ACTIVE REQUEST ON SHARED RELAY</div>}
        {state.recordRequested && !state.recordTransmitted && (
          <button className="console-action archive-action" type="button" onClick={() => dispatch("transmit")}>
            <span>02</span><b>TRANSMIT AX-C03-7</b><i>Send role-safe citation →</i>
          </button>
        )}
        {state.recordTransmitted && !state.crossCheckAccepted && (
          <div className="awaiting"><span className="status-lamp" /> AWAITING OPERATIONS ACKNOWLEDGEMENT</div>
        )}
        {state.crossCheckAccepted && <div className="complete-mark">C03 PROTOCOL SEQUENCE / COMPLETE</div>}
      </div>
    </section>
  );
}

function PlayPage() {
  const [perspective, setPerspective] = useState<Perspective>("operations");
  const [state, dispatch] = useReducer(demoReducer, initialDemoState);

  return (
    <main className="play-page">
      <section className="play-intro grid-shell">
        <div>
          <p className="eyebrow"><span>PHASE 0</span> / INTERFACE VALIDATION</p>
          <h1 id="page-heading" tabIndex={-1}>C03 PROTOCOL TEST</h1>
        </div>
        <div className="test-disclosure">
          <strong>LOCAL / ONE DEVICE / NO NETWORK SESSION</strong>
          <p>
            This is a perspective handoff demonstrator, not online multiplayer. Switch roles on this device and pass only what each role can see.
          </p>
          <p>The preview contains only role-safe projections. Canonical state remains server-only.</p>
        </div>
      </section>

      <section className="protocol-workspace">
        <div className="protocol-toolbar">
          <div className="perspective-switcher" role="group" aria-label="Select local perspective">
            <span>ACTIVE VIEW</span>
            <button
              type="button"
              aria-pressed={perspective === "operations"}
              onClick={() => setPerspective("operations")}
            >
              <i>01</i> OPERATIONS
            </button>
            <button
              type="button"
              aria-pressed={perspective === "archives"}
              onClick={() => setPerspective("archives")}
            >
              <i>02</i> ARCHIVES
            </button>
          </div>
          <div className="sequence-readout">
            <span>LOCAL SEQUENCE</span><strong>{String(state.sequence).padStart(2, "0")} / 04</strong>
          </div>
        </div>

        <div className="workspace-grid">
          <div className="active-console">
            {perspective === "operations" ? (
              <OperationsPanel state={state} dispatch={dispatch} />
            ) : (
              <ArchivesPanel state={state} dispatch={dispatch} />
            )}
          </div>
          <aside className="relay-panel" aria-labelledby="relay-title">
            <div className="relay-title">
              <div><span>SHARED SURFACE</span><h2 id="relay-title">PROTOCOL RELAY</h2></div>
              <span className="status-lamp" />
            </div>
            <p className="relay-instruction">
              Only deliberate transmissions cross perspectives. Switching views does not create another player or connect to a server.
            </p>
            <DemoTimeline state={state} />
            <button className="reset-button" type="button" onClick={() => dispatch("reset")}>RESET LOCAL TEST</button>
          </aside>
        </div>
      </section>
    </main>
  );
}

type InfoPageProps = {
  index: string;
  eyebrow: string;
  title: string;
  lead: string;
  children: React.ReactNode;
};

function InfoPage({ index, eyebrow, title, lead, children }: InfoPageProps) {
  return (
    <main className="info-page grid-shell">
      <div className="info-index">{index}</div>
      <section className="info-header">
        <p className="eyebrow">{eyebrow}</p>
        <h1 id="page-heading" tabIndex={-1}>{title}</h1>
        <p className="info-lead">{lead}</p>
      </section>
      <div className="info-content">{children}</div>
    </main>
  );
}

function AboutPage() {
  return (
    <InfoPage
      index="A / 01"
      eyebrow="PROJECT DOSSIER"
      title="A mystery made of viewpoints."
      lead="SIGNAL//LOST is a cooperative asymmetric mystery for 2–6 players aboard ORPHEUS-17."
    >
      <article><span>01</span><h2>SEE LESS</h2><p>Each player works through a role-specific interface. No individual view contains the whole incident.</p></article>
      <article><span>02</span><h2>SAY MORE</h2><p>The important action happens between screens: describing evidence, challenging assumptions, and deciding what to trust.</p></article>
      <article><span>03</span><h2>BUILD THE RECORD</h2><p>Live system states and archived records create different kinds of certainty. Their disagreement is the mystery’s working material.</p></article>
      <div className="info-callout"><strong>SAME STATION.</strong><strong>DIFFERENT TRUTH.</strong></div>
    </InfoPage>
  );
}

function DevlogPage() {
  return (
    <InfoPage
      index="D / 00"
      eyebrow="DEVELOPMENT SIGNAL"
      title="Phase 0 is active."
      lead="Public development notes will document verified milestones without exposing unreleased story material."
    >
      <article className="log-entry">
        <span>PHASE 0</span><h2>PROTOCOL SURFACE</h2>
        <p>The first public build establishes the visual language, local C03 perspective handoff, and static project information.</p>
        <ul><li>OPERATIONS and ARCHIVES test views</li><li>One-device transient relay</li><li>No accounts, analytics, cookies, or persistent storage</li></ul>
      </article>
      <article className="log-entry log-next">
        <span>NEXT SIGNAL</span><h2>AWAITING CLEARANCE</h2>
        <p>Future entries will appear only when a milestone is ready to be verified publicly.</p>
      </article>
    </InfoPage>
  );
}

function SupportPage() {
  return (
    <InfoPage
      index="S / 01"
      eyebrow="SUPPORT CHANNEL"
      title="Before you transmit."
      lead="The Phase-0 surface is a local protocol test. It does not create a lobby, account, or network session."
    >
      <article><span>01</span><h2>RUNNING THE TEST</h2><p>Open the protocol test, choose OPERATIONS, and follow its relay action. Switch to ARCHIVES only when the shared relay asks for that perspective.</p></article>
      <article><span>02</span><h2>RESETTING</h2><p>Use “Reset local test” to clear the transient sequence. Reloading the page also starts over because nothing is written to browser storage.</p></article>
      <article><span>03</span><h2>COMPATIBILITY</h2><p>Use a current browser with JavaScript enabled for the interactive demonstrator. Legal information remains directly readable without JavaScript.</p></article>
      <div className="info-callout compact"><span>SUPPORT CONTACT</span><strong>[SUPPORT EMAIL REQUIRED BEFORE PRODUCTION]</strong></div>
    </InfoPage>
  );
}

function SecurityPage() {
  return (
    <InfoPage
      index="SEC / 01"
      eyebrow="SECURITY CHANNEL"
      title="Minimal surface. Clear boundaries."
      lead="This Phase-0 client is designed to operate without accounts, tracking, browser persistence, or third-party runtime requests."
    >
      <article><span>DATA</span><h2>NO CLIENT PERSISTENCE</h2><p>The C03 demonstrator keeps its sequence only in volatile page memory. It does not use cookies, localStorage, or sessionStorage.</p></article>
      <article><span>NET</span><h2>OWN-ORIGIN ONLY</h2><p>Application network paths are reserved under the same origin. This public test makes no gameplay API request.</p></article>
      <article><span>REPORT</span><h2>RESPONSIBLE DISCLOSURE</h2><p>Do not include credentials, personal data, or unreleased story material in a security report.</p></article>
      <div className="info-callout compact"><span>SECURITY CONTACT</span><strong>[SECURITY EMAIL REQUIRED BEFORE PRODUCTION]</strong></div>
    </InfoPage>
  );
}

function NotFoundPage() {
  return (
    <main className="not-found">
      <div className="error-code">404</div>
      <p className="eyebrow">SIGNAL PATH NOT FOUND</p>
      <h1 id="page-heading" tabIndex={-1}>No receiver at this coordinate.</h1>
      <Link href="/" className="button button-primary"><span>RETURN HOME</span><b>←</b></Link>
    </main>
  );
}

function RoutedPage({ path }: { path: string }) {
  switch (path) {
    case "/": return <LandingPage />;
    case "/play": return <PlayPage />;
    case "/about": return <AboutPage />;
    case "/devlog": return <DevlogPage />;
    case "/support": return <SupportPage />;
    case "/security": return <SecurityPage />;
    default: return <NotFoundPage />;
  }
}

export function App() {
  const path = useRoute();
  const isInitialRoute = useRef(true);

  useEffect(() => {
    const route = knownRoutes.has(path as RoutePath) ? (path as RoutePath) : null;
    document.title = route ? routeTitles[route] : "Signal Not Found // SIGNAL//LOST";

    if (isInitialRoute.current) {
      isInitialRoute.current = false;
      return;
    }

    const heading = document.getElementById("page-heading");
    heading?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [path]);

  return (
    <div className="app-shell">
      <a className="skip-link" href="#page-heading">Skip to content</a>
      <Header path={path} />
      <div id="main-content"><RoutedPage path={path} /></div>
      <Footer />
    </div>
  );
}
