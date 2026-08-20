"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { AssessmentFooter, AssessmentHeader } from "@/components/assessment/AssessmentChrome";
import { useAssessment } from "@/controllers/AssessmentContext";
import { useAuth } from "@/controllers/AuthContext";
import type {
  AssessmentMessageResult,
  AssessmentCompletedResult,
  AssessmentQuestionResult,
  AssessmentSession,
  AssessmentSessionDetailResponse,
} from "@/models/assessment";
import { api, normalizeError } from "@/services/api";

function AiAssessmentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { draft } = useAssessment();
  const { isAuthenticated, initializing: authInitializing, profile: authProfile } = useAuth();
  const sessionId = searchParams.get("sessionId");
  const paymentStatus = searchParams.get("payment");
  const [session, setSession] = useState<AssessmentSession | null>(null);
  const [context, setContext] = useState<AssessmentSessionDetailResponse["context"] | null>(null);
  const [result, setResult] = useState<AssessmentMessageResult | null>(null);
  const [summary, setSummary] = useState<AssessmentCompletedResult | null>(null);
  const [entitlement, setEntitlement] = useState<{ accessTier: "free" | "paid"; assessmentStage: string; entitlement: { status: "active" | "revoked" } | null } | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [advancedStarting, setAdvancedStarting] = useState(false);
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setError("This assessment session link is missing.");
      setLoading(false);
      return;
    }

    let cancelled = false;
    void api.assessment
      .getSession(sessionId)
      .then((response) => {
        if (cancelled) return;
        setSession(response.session);
        setContext(response.context);
        if (isAuthenticated && authProfile) {
          void api.assessment.getEntitlement(sessionId).then(setEntitlement).catch(() => undefined);
        }
        setResult(response.context.currentQuestion ?? null);
        if (!response.context.currentQuestion) {
          void api.assessment.getSummary(sessionId).then((summaryResponse) => {
            setSummary(summaryResponse.summary);
            setResult(summaryResponse.summary);
          }).catch(() => undefined);
        }
      })
      .catch((cause) => {
        if (!cancelled) setError(normalizeError(cause).message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [authProfile, isAuthenticated, sessionId]);

  useEffect(() => {
    if (!authProfile || paymentStatus !== "success" || !sessionId || entitlement?.accessTier === "paid") return;
    let attempts = 0;
    const timer = window.setInterval(() => {
      attempts += 1;
      void api.assessment.getEntitlement(sessionId).then((next) => {
        setEntitlement(next);
        if (next.accessTier === "paid" || attempts >= 6) window.clearInterval(timer);
      }).catch(() => { if (attempts >= 6) window.clearInterval(timer); });
    }, 3000);
    return () => window.clearInterval(timer);
  }, [authProfile, entitlement?.accessTier, paymentStatus, sessionId]);

  async function submitAnswer() {
    if (!sessionId || !session || !answer.trim() || sending) return;
    setSending(true);
    setError(null);
    try {
      const response = await api.assessment.submitMessage(sessionId, {
        clientMessageId: crypto.randomUUID(),
        text: answer.trim(),
        expectedSessionRevision: session.revision,
      });
      setSession(response.session);
      if (!response.result || typeof response.result.type !== "string") {
        throw new Error("Assessment response is missing a valid result.");
      }
      setResult(response.result);
      if (response.result.type === "completed") {
        void api.assessment.getSummary(sessionId).then((summaryResponse) => setSummary(summaryResponse.summary)).catch(() => setSummary(response.result as AssessmentCompletedResult));
      }
      setContext((previous) =>
        previous
          ? {
              ...previous,
              currentQuestion: response.result.type === "question" ? response.result : undefined,
              missingFields:
                response.result.type === "question"
                  ? previous.missingFields.slice(1)
                  : [],
            }
          : previous,
      );
      setAnswer("");
    } catch (cause) {
      const normalized = normalizeError(cause);
      if (normalized.code === "CONFLICT") {
        try {
          const latest = await api.assessment.getSession(sessionId);
          setSession(latest.session);
          setContext(latest.context);
          setResult(latest.context.currentQuestion ?? null);
          setAnswer("");
          setError("The session was updated. Your latest state has been loaded.");
          return;
        } catch {
          // Preserve the original error below when the refresh also fails.
        }
      }
      setError(normalized.message);
    } finally {
      setSending(false);
    }
  }

  async function unlockAdvancedAssessment() {
    if (!sessionId || checkoutLoading) return;
    if (!isAuthenticated) {
      const paymentQuery = paymentStatus ? `&payment=${encodeURIComponent(paymentStatus)}` : "";
      const returnTo = `/assessment/ai?sessionId=${encodeURIComponent(sessionId)}${paymentQuery}`;
      router.push(`/login?returnTo=${encodeURIComponent(returnTo)}`);
      return;
    }
    if (authInitializing) {
      setError("Đang xác thực tài khoản Panda Cloud. Vui lòng thử lại sau giây lát.");
      return;
    }
    if (!authProfile) {
      setError("Tài khoản chưa được xác thực với Panda Cloud. Vui lòng đăng xuất và đăng nhập lại trước khi thanh toán.");
      return;
    }
    setCheckoutLoading(true);
    setError(null);
    try {
      const checkout = await api.assessment.createCheckout(sessionId);
      window.location.assign(checkout.checkoutUrl);
    } catch (cause) {
      setError(normalizeError(cause).message);
      setCheckoutLoading(false);
    }
  }

  async function startAdvancedAssessment() {
    if (!sessionId || advancedStarting) return;
    setAdvancedStarting(true);
    try {
      await api.assessment.startAdvanced(sessionId);
      const latest = await api.assessment.getSession(sessionId);
      setSession(latest.session);
      setContext(latest.context);
      setResult(latest.context.currentQuestion ?? null);
      setSummary(null);
    } catch (cause) {
      setError(normalizeError(cause).message);
    } finally {
      setAdvancedStarting(false);
    }
  }

  const question = result?.type === "question" ? result : null;
  const completed = result?.type === "completed" ? result : null;

  return (
    <>
      <AssessmentHeader exitHref="/assessment" exitLabel="Exit assessment" />
      <main className="mx-auto flex w-full max-w-[1200px] flex-1 flex-col gap-[24px] px-[24px] py-[32px] lg:px-[40px]">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[1.4px] text-accent">AI Assessment</p>
          <h1 className="mt-[8px] font-sans text-[32px] font-semibold text-white">Adaptive Site Review</h1>
          <p className="mt-[8px] max-w-[700px] text-[14px] leading-[22px] text-ink-dim">
            Your Land Form information is already loaded. The assistant will only ask for missing or uncertain details.
          </p>
        </div>

        {error ? <p role="alert" className="rounded-field border border-red-400/40 bg-red-400/10 p-[14px] text-[13px] text-red-200">{error}</p> : null}
        {paymentStatus === "success" && !isAuthenticated ? <p className="rounded-field border border-amber-300/30 bg-amber-300/5 p-[14px] text-[13px] text-amber-100">Payment return detected. Please log in with the same Panda Cloud account to verify the payment and continue this assessment.</p> : null}
        {paymentStatus === "success" && authProfile && entitlement?.accessTier !== "paid" ? <p className="rounded-field border border-accent/30 bg-accent/5 p-[14px] text-[13px] text-accent">Payment received. We are confirming your checkout with Stripe. Refresh this page in a moment to continue.</p> : null}
        {!authInitializing && (!isAuthenticated || !authProfile) && completed ? <p className="rounded-field border border-amber-300/30 bg-amber-300/5 p-[14px] text-[13px] text-amber-100">Đăng nhập và xác thực Panda Cloud trước khi thanh toán để giao dịch được gắn đúng tài khoản và assessment này.</p> : null}
        {paymentStatus === "cancelled" ? <p className="rounded-field border border-amber-300/30 bg-amber-300/5 p-[14px] text-[13px] text-amber-100">Checkout was cancelled. Your free assessment is still available.</p> : null}
        {loading ? <p className="text-[14px] text-ink-dim">Loading assessment context…</p> : null}

        <div className="grid gap-[24px] lg:grid-cols-[280px_1fr]">
          <aside className="rounded-card border border-line-hair bg-card p-[20px]">
            <h2 className="font-mono text-[11px] uppercase tracking-[1.2px] text-ink-dim">Known information</h2>
            <ul className="mt-[14px] space-y-[8px] text-[13px] text-ink">
              {context ? Object.entries(context.knownFields)
                .filter(([, value]) => value !== null && value !== undefined && !(typeof value === "string" && value.trim() === ""))
                .filter(([field]) => !context.missingFields.includes(field))
                .map(([field]) => <li key={field}>✓ {field}</li>) : <li>Loading…</li>}
            </ul>
            <h2 className="mt-[24px] font-mono text-[11px] uppercase tracking-[1.2px] text-ink-dim">Missing / verify</h2>
            <ul className="mt-[14px] space-y-[8px] text-[13px] text-ink-dim">
              {context?.missingFields.length ? context.missingFields.map((field) => <li key={field}>? {field}</li>) : <li>Nothing outstanding</li>}
            </ul>
          </aside>

          <section className="rounded-card border border-accent/30 bg-glass p-[24px]">
            <div className="min-h-[220px]">
              {question ? <QuestionCard question={question} /> : null}
              {completed ? <CompletionCard result={summary ?? completed} paid={session?.accessTier === "paid"} /> : null}
              {completed && entitlement?.accessTier !== "paid" ? <PaidAssessmentPaywall authenticated={Boolean(isAuthenticated && authProfile)} loading={checkoutLoading} onUnlock={() => void unlockAdvancedAssessment()} /> : null}
              {(completed || (entitlement?.accessTier === "paid" && session?.assessmentStage === "advanced_unlocked")) && entitlement?.accessTier === "paid" ? <AdvancedAssessmentGate loading={advancedStarting} onStart={() => void startAdvancedAssessment()} /> : null}
              {!question && !completed && session?.accessTier === "paid" && session.assessmentStage === "advanced_in_progress" ? <AdvancedRecovery loading={advancedStarting || loading} onRetry={() => void startAdvancedAssessment()} /> : null}
              {!question && !completed && !loading ? <p className="text-[14px] text-ink-dim">No active question.</p> : null}
              {session?.accessTier === "paid" && (question || session.assessmentStage === "advanced_in_progress") ? <PaidProgress current={session.paidQuestionCount ?? 0} max={session.maxPaidQuestions ?? 10} /> : null}
            </div>

            {question ? (
              <div className="mt-[24px] border-t border-line-hair pt-[20px]">
                <label htmlFor="assessment-answer" className="mb-[8px] block text-[13px] text-ink-dim">Your answer</label>
                <textarea
                  id="assessment-answer"
                  value={answer}
                  onChange={(event) => setAnswer(event.target.value)}
                  rows={4}
                  maxLength={10000}
                  disabled={sending}
                  className="w-full rounded-field border border-line-strong bg-deep p-[14px] text-[14px] text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none"
                  placeholder="Describe what you know…"
                />
                <button
                  type="button"
                  onClick={submitAnswer}
                  disabled={!answer.trim() || sending}
                  className="mt-[12px] rounded-field bg-accent px-[18px] py-[11px] font-mono text-[11px] uppercase tracking-[1.1px] text-black disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {sending ? "Processing…" : "Send answer"}
                </button>
              </div>
            ) : null}
          </section>
        </div>

        {draft ? <p className="text-[11px] text-ink-faint">Session: {sessionId ?? "—"}</p> : null}
        <button
          type="button"
          onClick={() => router.push(sessionId ? `/assessment/results?id=${encodeURIComponent(sessionId)}` : "/assessment")}
          className="self-start text-[12px] text-accent underline underline-offset-4"
        >
          Return to assessment results
        </button>
      </main>
      <AssessmentFooter note="AI Assessment Module" />
    </>
  );
}

function PaidAssessmentPaywall({ authenticated, loading, onUnlock }: { authenticated: boolean; loading: boolean; onUnlock: () => void }) {
  return (
    <div className="mt-[24px] rounded-card border border-accent/40 bg-gradient-to-br from-accent/10 via-card to-card p-[20px] shadow-[0_0_28px_rgba(0,242,255,0.08)]">
      <p className="font-mono text-[10px] uppercase tracking-[1.2px] text-accent">Unlock advanced assessment</p>
      <h3 className="mt-[9px] text-[21px] font-semibold text-white">Continue with a deeper site evaluation</h3>
      <p className="mt-[8px] text-[13px] leading-[21px] text-ink-dim">Your free assessment is complete. Unlock the advanced review to receive a full feasibility report, deeper infrastructure analysis, risk evaluation and priority specialist follow-up.</p>
      <div className="mt-[15px] grid gap-[8px] text-[12px] text-ink sm:grid-cols-2">
        <span>✓ Advanced evaluation questions</span><span>✓ Full feasibility report</span><span>✓ Infrastructure and risk analysis</span><span>✓ Priority sales specialist review</span>
      </div>
      <button type="button" onClick={onUnlock} disabled={loading} className="mt-[18px] rounded-full bg-accent px-[20px] py-[12px] font-mono text-[11px] uppercase tracking-[1px] text-black disabled:opacity-50">{loading ? "Opening checkout…" : authenticated ? "Unlock advanced review" : "Log in to continue"}</button>
      <p className="mt-[9px] text-[11px] text-ink-faint">$59 one-time payment · Secure checkout powered by Stripe</p>
    </div>
  );
}

function AdvancedAssessmentGate({ loading, onStart }: { loading: boolean; onStart: () => void }) {
  return <div className="mt-[24px] rounded-card border border-accent/40 bg-accent/10 p-[20px]"><p className="font-mono text-[10px] uppercase tracking-[1.2px] text-accent">Advanced review unlocked</p><h3 className="mt-[9px] text-[21px] font-semibold text-white">Continue your paid assessment</h3><p className="mt-[8px] text-[13px] leading-[21px] text-ink-dim">Your payment is confirmed. Continue to the deeper evaluation and full report.</p><button type="button" onClick={onStart} disabled={loading} className="mt-[16px] rounded-full bg-accent px-[20px] py-[12px] font-mono text-[11px] uppercase tracking-[1px] text-black disabled:opacity-50">{loading ? "Preparing review…" : "Continue advanced assessment"}</button></div>;
}

function AdvancedRecovery({ loading, onRetry }: { loading: boolean; onRetry: () => void }) {
  return <div className="mt-[24px] rounded-card border border-amber-300/30 bg-amber-300/5 p-[20px]"><p className="font-mono text-[10px] uppercase tracking-[1.2px] text-amber-200">Preparing your advanced review</p><h3 className="mt-[9px] text-[21px] font-semibold text-white">The next question is not available yet</h3><p className="mt-[8px] text-[13px] leading-[21px] text-ink-dim">Your paid access is active and your previous answer is saved. We are restoring the next n8n-generated question.</p><button type="button" onClick={onRetry} disabled={loading} className="mt-[16px] rounded-full bg-accent px-[20px] py-[12px] font-mono text-[11px] uppercase tracking-[1px] text-black disabled:opacity-50">{loading ? "Restoring…" : "Retry advanced assessment"}</button></div>;
}

function QuestionCard({ question }: { question: AssessmentQuestionResult }) {
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-[1.2px] text-accent">Target: {question.targetField}</p>
      <h2 className="mt-[14px] font-sans text-[24px] leading-[34px] text-white">{question.question}</h2>
      {question.evidenceRequired ? <p className="mt-[16px] text-[13px] text-ink-dim">Evidence may be requested after your answer.</p> : null}
    </div>
  );
}

function CompletionCard({ result, paid }: { result: Extract<AssessmentMessageResult, { type: "completed" }>; paid?: boolean }) {
  const recommendation = result.overallRecommendation.replaceAll("_", " ");
  return (
    <div className="space-y-[20px]">
      <div className="flex flex-wrap items-start justify-between gap-[14px]">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[1.2px] text-accent">AI assessment complete</p>
          <h2 className="mt-[10px] font-sans text-[26px] leading-[34px] text-white">{paid ? "Your paid Decision Pack" : "Your assessment summary"}</h2>
          <p className="mt-[8px] text-[13px] text-ink-dim">{paid ? "A structured feasibility decision, evidence review and 30/60/90-day action plan." : "Generated from your free responses and ready for human review."}</p>
        </div>
        <span className="rounded-full border border-accent/40 bg-accent/10 px-[12px] py-[7px] font-mono text-[10px] uppercase tracking-[1px] text-accent">{recommendation}</span>
      </div>

      <div className="grid gap-[12px] sm:grid-cols-2">
        <div className="rounded-field border border-line-hair bg-deep/70 p-[14px]">
          <p className="font-mono text-[10px] uppercase tracking-[1.1px] text-ink-dim">Information coverage</p>
          <div className="mt-[10px] flex items-end justify-between gap-[12px]">
            <p className="text-[26px] font-semibold text-white">{result.informationCoveragePercent}%</p>
            <p className="text-right text-[12px] text-ink-dim">of required information</p>
          </div>
          <div className="mt-[10px] h-[5px] overflow-hidden rounded-full bg-line-hair"><div className="h-full rounded-full bg-accent" style={{ width: `${Math.max(0, Math.min(100, result.informationCoveragePercent))}%` }} /></div>
        </div>
        <div className="rounded-field border border-line-hair bg-deep/70 p-[14px]">
          <p className="font-mono text-[10px] uppercase tracking-[1.1px] text-ink-dim">Review status</p>
          <p className="mt-[10px] text-[17px] font-medium text-white">{result.needsHumanReview ? "Human verification required" : "Ready to proceed"}</p>
          <p className="mt-[5px] text-[12px] text-ink-dim">Validate evidence before making a deployment decision.</p>
        </div>
      </div>

      {result.summary ? (
        <div className="rounded-field border border-accent/20 bg-accent/5 p-[16px]">
          <p className="font-mono text-[10px] uppercase tracking-[1.2px] text-accent">Summary</p>
          <p className="mt-[10px] text-[14px] leading-[23px] text-ink">{result.summary}</p>
        </div>
      ) : null}

      <div className="grid gap-[12px] sm:grid-cols-2">
        {result.criticalGaps.length ? <SummaryList title="Critical gaps" items={result.criticalGaps} tone="warning" /> : null}
        {result.missingEvidence.length ? <SummaryList title="Evidence to verify" items={result.missingEvidence} tone="warning" /> : null}
      </div>

      {result.recommendations.length ? <SummaryList title="Recommended next steps" items={result.recommendations} /> : null}
      {paid ? <PaidDecisionPack result={result} /> : null}
    </div>
  );
}

function PaidProgress({ current, max }: { current: number; max: number }) {
  const percent = Math.min(100, Math.round((current / max) * 100));
  return <div className="mt-[20px] rounded-field border border-accent/20 bg-accent/5 p-[14px]"><div className="flex justify-between text-[12px] text-ink-dim"><span>Advanced assessment progress</span><span>{Math.min(current, max)}/{max} questions</span></div><div className="mt-[9px] h-[6px] overflow-hidden rounded-full bg-line-hair"><div className="h-full rounded-full bg-accent transition-all" style={{ width: `${percent}%` }} /></div></div>;
}

function PaidDecisionPack({ result }: { result: Extract<AssessmentMessageResult, { type: "completed" }> }) {
  const score = typeof result.feasibilityScore === "number" ? result.feasibilityScore : null;
  const breakdown = result.scoreBreakdown ?? {};
  const actionPlan = result.actionPlan ?? {};
  return <div className="mt-[20px] space-y-[12px]">
    <p className="font-mono text-[10px] uppercase tracking-[1.2px] text-accent">Decision Pack</p>
    {score !== null ? <div className="rounded-field border border-accent/20 bg-accent/5 p-[14px]"><div className="flex items-end justify-between"><span className="text-[13px] text-ink-dim">Feasibility score</span><span className="text-[28px] font-semibold text-white">{score}/100</span></div><div className="mt-[9px] grid grid-cols-2 gap-[8px] text-[12px] text-ink-dim sm:grid-cols-4">{Object.entries(breakdown).map(([key, value]) => <span key={key}>{key}: <b className="text-ink">{String(value)}</b></span>)}</div></div> : null}
    {result.criticalBlockers?.length ? <ObjectList title="Critical blockers" items={result.criticalBlockers} tone="warning" /> : null}
    {result.infrastructureAssessment ? <ObjectList title="Infrastructure assessment" items={[result.infrastructureAssessment]} /> : null}
    {result.planningEvidence?.length ? <ObjectList title="Planning and evidence review" items={result.planningEvidence} /> : null}
    {result.developmentPlan?.length ? <ObjectList title="Development plan" items={result.developmentPlan} /> : null}
    {Object.keys(actionPlan).length ? <ObjectList title="30 / 60 / 90-day action plan" items={[actionPlan]} /> : null}
    <div className="rounded-field border border-accent/30 bg-accent/10 p-[14px] text-[13px] text-ink">A Panda Cloud infrastructure specialist can review the evidence and help you decide the next deployment step.</div>
  </div>;
}

export default function AiAssessmentPage() {
  return <Suspense fallback={<main className="flex min-h-screen items-center justify-center text-ink-dim">Loading assessment…</main>}><AiAssessmentContent /></Suspense>;
}

function ObjectList({ title, items, tone = "default" }: { title: string; items: Array<Record<string, unknown>>; tone?: "default" | "warning" }) {
  return <div className={`rounded-field border p-[14px] ${tone === "warning" ? "border-amber-300/20 bg-amber-300/5" : "border-line-hair bg-deep/50"}`}><p className={`font-mono text-[10px] uppercase tracking-[1.1px] ${tone === "warning" ? "text-amber-200" : "text-ink-dim"}`}>{title}</p><div className="mt-[10px] space-y-[8px] text-[12px] leading-[19px] text-ink">{items.map((item, index) => <p key={index}>{Object.entries(item).map(([key, value]) => `${key.replaceAll("_", " ")}: ${typeof value === "object" ? JSON.stringify(value) : String(value)}`).join(" · ")}</p>)}</div></div>;
}

function SummaryList({ title, items, tone = "default" }: { title: string; items: string[]; tone?: "default" | "warning" }) {
  return (
    <div className={`rounded-field border p-[14px] ${tone === "warning" ? "border-amber-300/20 bg-amber-300/5" : "border-line-hair bg-deep/50"}`}>
      <p className={`font-mono text-[10px] uppercase tracking-[1.1px] ${tone === "warning" ? "text-amber-200" : "text-ink-dim"}`}>{title}</p>
      <ul className="mt-[10px] space-y-[8px] text-[13px] leading-[20px] text-ink">
        {items.map((item, index) => <li key={`${item}-${index}`} className="flex gap-[8px]"><span className="text-accent">•</span><span>{item}</span></li>)}
      </ul>
    </div>
  );
}
