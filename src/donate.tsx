import { useEffect, useState, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import "./donate.css";
import { mountOfflineBanner } from "./offline-banner";
import { registerServiceWorker } from "./register-sw";
import { t, tp } from "./i18n";
import { PageLocaleToggle, usePageLocale } from "./app/page-locale";
import { GITHUB_URL } from "./app/social-links";
import { DEFAULT_CONTRIBUTORS, loadContributorSnapshot } from "./contributors";

const AMOUNTS = [5, 10, 25, 50, 100];

type DonationType = "once" | "monthly";

const SPONSORS_URL = "https://github.com/sponsors/OpenMouse-Project";

// GitHub Sponsors accepts amount/frequency as query params to preselect a
// tier on their own checkout page. These aren't formally documented as a
// stable API -- worth re-checking that they still land on the right tier
// if GitHub ever changes them; degrades to the plain sponsors page if not.
function sponsorsUrl(type: DonationType, amount: number): string {
  const params = new URLSearchParams({
    frequency: type === "monthly" ? "recurring" : "one-time",
    amount: String(Math.round(amount)),
  });
  return `${SPONSORS_URL}?${params.toString()}`;
}

function GitHubIcon(): ReactNode {
  return (
    <svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true">
      <path fill="currentColor" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
    </svg>
  );
}

function DiscordIcon(): ReactNode {
  return (
    <svg viewBox="0 0 126.644 96" aria-hidden="true">
      <path fill="currentColor" d="M81.15,0c-1.2376,2.1973-2.3489,4.4704-3.3591,6.794-9.5975-1.4396-19.3718-1.4396-28.9945,0-.985-2.3236-2.1216-4.5967-3.3591-6.794-9.0166,1.5407-17.8059,4.2431-26.1405,8.0568C2.779,32.5304-1.6914,56.3725.5312,79.8863c9.6732,7.1476,20.5083,12.603,32.0505,16.0884,2.6014-3.4854,4.8998-7.1981,6.8698-11.0623-3.738-1.3891-7.3497-3.1318-10.8098-5.1523.9092-.6567,1.7932-1.3386,2.6519-1.9953,20.281,9.547,43.7696,9.547,64.0758,0,.8587.7072,1.7427,1.3891,1.9953-3.4601,2.0457-7.0718,3.7632-10.835,5.1776,1.97,3.8642,4.2683,7.5769,6.8698,11.0623,11.5419-3.4854,22.3769-8.9156,32.0509-16.0631,2.626-27.2771-4.496-50.9172-18.817-71.8548C98.9811,4.2684,90.1918,1.5659,81.1752.0505l-.0252-.0505ZM42.2802,65.4144c-6.2383,0-11.4159-5.6575-11.4159-12.6535s4.9755-11.4159,11.3907-12.6788,11.5169,5.708,11.4159,12.6788c-.101,6.9708-5.026,12.6535-11.3907,12.6535ZM84.3576,65.4144c-6.2637,0-11.3907-5.6575-11.3907-12.6535s4.9755-12.6788,11.3907-12.6788,11.4917,5.708,11.3906,12.6788c-.101,6.9708-5.026,12.6535-11.3906,12.6535Z" />
    </svg>
  );
}

function StarIcon(): ReactNode {
  return (
    <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
      <path fill="currentColor" d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z" />
    </svg>
  );
}

function XIcon(): ReactNode {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function LockIcon(): ReactNode {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
      <path fill="currentColor" d="M8 1a2.75 2.75 0 0 0-2.75 2.75V6h-.5A1.75 1.75 0 0 0 3 7.75v5.5C3 14.21 3.79 15 4.75 15h6.5c.96 0 1.75-.79 1.75-1.75v-5.5C13 6.79 12.21 6 11.25 6h-.5V3.75A2.75 2.75 0 0 0 8 1Zm1.5 6.5v4a.75.75 0 0 1-1.5 0v-4a.75.75 0 0 1 1.5 0Zm-4-1h5V3.75a1.25 1.25 0 0 0-2.5 0V6a1 1 0 0 0 0-.25.25.25 0 0 0 .25-.25V3.75a1.25 1.25 0 0 0-2.5 0V5.5a.25.25 0 0 0 .25.25.25.25 0 0 0 0 .25v.5ZM6.25 6V3.75a.75.75 0 0 1 1.5 0V6h-1.5Z" />
    </svg>
  );
}

function formatCurrency(n: number, locale: string): string {
  const numberLocale = locale === "pt" ? "pt-BR" : locale === "vi" ? "vi-VN" : "en-US";
  return new Intl.NumberFormat(numberLocale, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

function formatContributions(n: number, locale: string): string {
  const numberLocale = locale === "pt" ? "pt-BR" : locale === "vi" ? "vi-VN" : "en-US";
  return new Intl.NumberFormat(numberLocale).format(n);
}

function formatStars(n: number): string {
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

function DonateApp(): ReactNode {
  const [locale, setLocale] = usePageLocale();
  const [type, setType] = useState<DonationType>("once");
  const [amount, setAmount] = useState<number>(10);
  const [custom, setCustom] = useState("");
  const [contributors, setContributors] = useState(DEFAULT_CONTRIBUTORS);
  const [stars, setStars] = useState<number | null>(1473);

  useEffect(() => {
    void loadContributorSnapshot()
      .then((snapshot) => {
        setContributors(snapshot.contributors);
        setStars(snapshot.stars);
      })
      .catch(() => {
        // The baked-in snapshot remains visible offline or during a bad deploy.
      });
  }, []);

  const customValue = Number(custom);
  const effectiveAmount = custom.trim() !== "" && Number.isFinite(customValue) && customValue > 0 ? customValue : amount;

  return (
    <div className="don-shell">
      <div className="don-bg" aria-hidden="true" />

      <header className="don-header">
        <a className="don-wordmark" href="/" aria-label="OpenMouse home">
          <img className="don-logo" src="/logo.png" alt="" width={181} height={268} />
          OpenMouse
        </a>
        <nav className="don-nav" aria-label="Sections">
          <a href="/supported.html">{t(locale, "don.devices")}</a>
          <a href="/donate.html" aria-current="page" className="is-current">{t(locale, "don.support")}</a>
          <a href="/check.html">{t(locale, "don.check")}</a>
          <a href="https://docs.openmouse.app">{t(locale, "don.contribute")}</a>
        </nav>
        <PageLocaleToggle locale={locale} onChange={setLocale} />
        <div className="don-actions">
          <a className="don-github" href={GITHUB_URL} target="_blank" rel="noreferrer">
            <GitHubIcon />
            <span className="don-github-label">GitHub</span>
            {stars !== null ? (
              <span className="don-stars" aria-label={tp(locale, "don.stars", { n: formatStars(stars) })}>
                <StarIcon />
                {formatStars(stars)}
              </span>
            ) : null}
          </a>
        </div>
      </header>

      <main>
        <section className="don-hero">
          <span className="don-hero-eyebrow">{t(locale, "don.eyebrow")}</span>
          <h1>{t(locale, "don.heroA")} <em>{t(locale, "don.heroB")}</em></h1>
          <p className="don-lead">
            {t(locale, "don.lead")}
          </p>
        </section>

        <section className="don-grid" aria-label="Support options">
          <article className="don-card don-profile-card">
            <span className="don-avatar-wrap">
              <img className="don-avatar" src="/logo.png" alt="" width={72} height={72} />
            </span>
            <div className="don-profile-body">
              <h2>{t(locale, "don.profileTitle")}</h2>
              <p className="don-role">{t(locale, "don.profileRole")}</p>
              <p>
                {t(locale, "don.profileB1")}
              </p>
              <p>
                {t(locale, "don.profileB2")}
              </p>
              <p>{t(locale, "don.thanks")}</p>
              <p className="don-optional">{t(locale, "don.optional")}</p>
            </div>
          </article>

          <article className="don-card don-form-card">
            <div className="don-field">
              <span className="don-label">{t(locale, "don.type")}</span>
              <div className="don-seg" role="tablist" aria-label={t(locale, "don.type")}>
                <button
                  type="button"
                  role="tab"
                  aria-selected={type === "once"}
                  className={`don-seg-btn${type === "once" ? " is-on" : ""}`}
                  onClick={() => setType("once")}
                >
                  {t(locale, "don.once")}
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={type === "monthly"}
                  className={`don-seg-btn${type === "monthly" ? " is-on" : ""}`}
                  onClick={() => setType("monthly")}
                >
                  {t(locale, "don.monthly")}
                </button>
              </div>
            </div>

            <div className="don-field">
              <span className="don-label">{t(locale, "don.amount")}</span>
              <div className="don-amounts">
                {AMOUNTS.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    className={`don-amount${amount === amt && custom.trim() === "" ? " is-on" : ""}`}
                    aria-pressed={amount === amt && custom.trim() === ""}
                    onClick={() => { setAmount(amt); setCustom(""); }}
                  >
                    ${amt}
                  </button>
                ))}
              </div>
            </div>

            <div className="don-field">
              <span className="don-label">{t(locale, "don.custom")}</span>
              <div className="don-custom">
                <span className="don-currency">$</span>
                <input
                  type="number"
                  min="1"
                  placeholder={t(locale, "don.customPh")}
                  value={custom}
                  onInput={(event) => setCustom((event.target as HTMLInputElement).value)}
                />
              </div>
            </div>

            <p className="don-charge">
              {type === "once"
                ? tp(locale, "don.chargeOnce", { v: formatCurrency(effectiveAmount, locale) })
                : tp(locale, "don.chargeMonthly", { v: formatCurrency(effectiveAmount, locale) })}
            </p>

            <a
              className="don-submit"
              href={sponsorsUrl(type, effectiveAmount)}
              target="_blank"
              rel="noreferrer"
            >
              <LockIcon />
              {t(locale, "don.submit")}
            </a>

            <a className="don-skip" href="/">{t(locale, "don.skip")}</a>
          </article>
        </section>

        <section className="don-contributors" aria-label={t(locale, "don.contribTitle")}>
          <div className="don-contrib-head">
            <span className="don-eyebrow">{t(locale, "don.contribEyebrow")}</span>
            <h2>{t(locale, "don.contribTitle")}</h2>
          </div>
          <div className="don-contrib-avatars">
            {contributors.map((c) => {
              const count = c.total;
              return (
                <a
                  key={c.login}
                  href={c.htmlUrl ?? `https://github.com/${c.login}`}
                  target="_blank"
                  rel="noreferrer"
                  className="don-contrib-avatar"
                  title={`${c.login} · ${count === 1 ? tp(locale, "don.contribOne", { n: formatContributions(count, locale) }) : tp(locale, "don.contribs", { n: formatContributions(count, locale) })}`}
                >
                  {c.avatar ? (
                    <img src={`${c.avatar}?s=64`} alt={c.login} loading="lazy" width={64} height={64} />
                  ) : (
                    <span className="don-avatar-fallback" aria-hidden="true">
                      {c.login.slice(0, 1).toUpperCase()}
                    </span>
                  )}
                </a>
              );
            })}
          </div>
          <a className="don-contrib-link" href={GITHUB_URL} target="_blank" rel="noreferrer">
            {t(locale, "don.seeAll")}
          </a>
        </section>
      </main>

      <footer className="don-footer">
        <div className="don-footer-grid">
          <div className="don-fbrand">
            <a className="don-fwordmark" href="/">OpenMouse Project</a>
            <p className="don-ftagline">{t(locale, "don.tagline")}</p>
          </div>

          <div className="don-fcol">
            <h3>{t(locale, "don.pages")}</h3>
            <a href="/">{t(locale, "don.home")}</a>
            <a href="/supported.html">{t(locale, "don.devices")}</a>
            <a href="/check.html">{t(locale, "don.check")}</a>
            <a href="https://docs.openmouse.app">{t(locale, "don.contribute")}</a>
          </div>

          <div className="don-fcol">
            <h3>{t(locale, "don.contributeCol")}</h3>
            <a href={GITHUB_URL} target="_blank" rel="noreferrer">GitHub</a>
            <a href="https://github.com/OpenMouse-Project/openmouse/issues" target="_blank" rel="noreferrer">{t(locale, "don.reportIssue")}</a>
            <a href="https://github.com/OpenMouse-Project/openmouse/discussions" target="_blank" rel="noreferrer">{t(locale, "don.discussions")}</a>
            <a href="https://github.com/OpenMouse-Project/openmouse" target="_blank" rel="noreferrer">{t(locale, "don.source")}</a>
          </div>

          <div className="don-fcol">
            <h3>{t(locale, "don.community")}</h3>
            <div className="don-fsocial">
              <a href={GITHUB_URL} target="_blank" rel="noreferrer" aria-label="GitHub">
                <GitHubIcon />
              </a>
              <a href="https://discord.gg/yxC9jzMdw6" target="_blank" rel="noreferrer" aria-label="Discord">
                <DiscordIcon />
              </a>
              <a href="https://x.com/openmouseapp" target="_blank" rel="noreferrer" aria-label="X / Twitter">
                <XIcon />
              </a>
            </div>
          </div>
        </div>

        <div className="don-footer-bottom">
          <p>
            {tp(locale, "don.rights", { year: new Date().getFullYear() })}
            <a href="/" className="don-flegal">{t(locale, "don.privacy")}</a>
            <a href="/" className="don-flegal">{t(locale, "don.terms")}</a>
          </p>
          <p>{t(locale, "don.created")} <a href={GITHUB_URL} target="_blank" rel="noreferrer">{t(locale, "don.theCommunity")}</a> {t(locale, "don.and")} <a href="/donate.html">{t(locale, "don.contributors")}</a>.</p>
        </div>
      </footer>
    </div>
  );
}

const root = document.querySelector<HTMLDivElement>("#donate-app");
if (!root) throw new Error("donate-app root not found");
createRoot(root).render(<DonateApp />);

registerServiceWorker();
mountOfflineBanner();
