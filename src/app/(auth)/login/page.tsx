"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSignIn } from "@clerk/nextjs";
import type { SignInResource } from "@clerk/types";
import { isClerkAPIResponseError } from "@clerk/nextjs/errors";
import { AmbientBackground } from "@/components/layout/AmbientBackground";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { useAuth } from "@/controllers/AuthContext";
import { useForm } from "@/controllers/useForm";
import { email as emailRule, minLength } from "@/lib/validation";
import { homeForProfile } from "@/config/access";
import { clerkEnabled } from "@/services/config";
import { safeReturnTo } from "@/lib/returnTo";
import { rememberResetEmailHint } from "@/lib/resetEmailHint";
import { AuthCard, ClerkNotConfigured, clerkErrorMessage } from "@/components/auth/AuthCard";

/**
 * Figma node 2:930 — "Log In | Panda Cloud". The card, type scale and button
 * are unchanged; only the submit handler moved to Clerk.
 *
 * PHASE_1_FRONTEND_AUTH_HANDOFF: "The existing PandaCloud visual design can
 * remain. Clerk custom-flow hooks/APIs can drive the current forms, so adopting
 * Clerk does not require switching to prebuilt Clerk UI components."
 *
 * PandaCloud issues no token here. Clerk creates the session; the PandaCloud
 * profile and authorization arrive afterwards from GET /api/v1/auth/me.
 */
export default function LoginPage() {
  // useSearchParams requires a Suspense boundary under the App Router.
  return (
    <Suspense>
      {clerkEnabled ? <LoginView /> : <ClerkNotConfigured action="Sign in" />}
    </Suspense>
  );
}

interface LoginFields {
  email: string;
  password: string;
}

function LoginView() {
  const router = useRouter();
  const params = useSearchParams();
  const { isLoaded, signIn, setActive } = useSignIn();
  const { isAuthenticated, reload } = useAuth();

  /**
   * Where to go after signing in. Only same-origin relative paths are
   * accepted — an absolute URL here would be an open-redirect vector.
   * Luật kiểm nằm ở lib/returnTo, dùng chung với signup và forgot-password.
   */
  const returnTo = safeReturnTo(params.get("returnTo"));
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [verificationRequired, setVerificationRequired] = useState(false);
  // null = chưa xác định. KHÔNG mặc định "phone_code": mặc định một strategy
  // mà tài khoản có thể không bật chính là nguyên nhân của lối cụt bên dưới.
  const [secondFactorStrategy, setSecondFactorStrategy] = useState<SecondFactorStrategy | null>(null);
  // Tách khỏi formError: "Nhập mã từ ứng dụng xác thực" là HƯỚNG DẪN, không
  // phải lỗi, nhưng lại đang được render bằng role="alert" màu đỏ.
  const [notice, setNotice] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState("");
  useEffect(() => {
    if (!isLoaded || !isAuthenticated) return;
    let active = true;
    void reload().then((profile) => {
      if (!active) return;
      // Clerk already has a session; do not create a second sign-in attempt.
      router.replace(returnTo ?? homeForProfile(profile));
    });
    return () => {
      active = false;
    };
  }, [isLoaded, isAuthenticated, reload, router, returnTo]);


  const form = useForm<LoginFields>(
    { email: "", password: "" },
    {
      email: emailRule(),
      password: minLength(8, "Password"),
    },
  );

  // Chỉ returnTo đi qua URL. Email được chuyển qua sessionStorage — xem
  // lib/resetEmailHint để biết vì sao không đặt nó vào query string.
  const forgotPasswordHref = returnTo
    ? `/forgot-password?returnTo=${encodeURIComponent(returnTo)}`
    : "/forgot-password";

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFormError(null);
    setNotice(null);
    if (!form.validateAll()) return;
    if (!isLoaded || !signIn || !setActive) return;

    setSubmitting(true);
    try {
      let attempt: SignInResource;
      if (verificationRequired) {
        if (!verificationCode.trim()) {
          setFormError("Nhập mã xác minh.");
          return;
        }
        if (!secondFactorStrategy) {
          setFormError("Không xác định được phương thức xác minh. Tải lại trang và thử lại.");
          return;
        }
        // MFA của Clerk chỉ nhận phone_code / totp / backup_code. "email_code"
        // là yếu tố THỨ NHẤT; dùng nó ở đây khiến Clerk trả
        // `strategy_for_user_invalid`, tức là mọi tài khoản bật MFA đều không
        // đăng nhập được.
        attempt = secondFactorStrategy === "totp"
          ? await signIn.attemptSecondFactor({ strategy: "totp", code: verificationCode.trim() })
          : secondFactorStrategy === "backup_code"
            ? await signIn.attemptSecondFactor({ strategy: "backup_code", code: verificationCode.trim() })
            : await signIn.attemptSecondFactor({ strategy: "phone_code", code: verificationCode.trim() });
      } else {
        attempt = await signIn.create({
          identifier: form.values.email,
          password: form.values.password,
        });

        if (attempt.status === "needs_second_factor") {
          // Chọn theo thứ tự ưu tiên trong SỐ CÁI TÀI KHOẢN THỰC SỰ BẬT. Bản
          // trước rơi thẳng vào nhánh phone_code khi không thấy totp, không hề
          // kiểm phone_code có tồn tại không — với tài khoản chỉ bật
          // backup_code (hoặc supportedSecondFactors rỗng), prepareSecondFactor
          // ném lỗi TRƯỚC setVerificationRequired(true), nên người dùng kẹt
          // vĩnh viễn ở form mật khẩu: bấm lần nào cũng lỗi, không có lối ra.
          const supported = attempt.supportedSecondFactors ?? [];
          const chosen = pickSecondFactor(supported);
          if (!chosen) {
            setFormError(
              "Tài khoản của bạn cần xác minh hai lớp, nhưng không có phương thức nào khả dụng " +
                "trên thiết bị này. Liên hệ quản trị viên để khôi phục quyền truy cập.",
            );
            return;
          }
          // TOTP và backup_code đọc mã từ phía người dùng nên KHÔNG có bước
          // prepare; gọi prepare cho chúng sẽ lỗi. Chỉ phone_code cần prepare
          // để Clerk gửi SMS.
          if (chosen === "phone_code") {
            await signIn.prepareSecondFactor({ strategy: "phone_code" });
            setNotice("Đã gửi mã xác minh tới số điện thoại của bạn.");
          } else if (chosen === "totp") {
            setNotice("Nhập mã từ ứng dụng xác thực của bạn.");
          } else {
            setNotice("Nhập một mã dự phòng của bạn.");
          }
          setSecondFactorStrategy(chosen);
          setVerificationRequired(true);
          return;
        }
      }

      if (attempt.status !== "complete" || !attempt.createdSessionId) {
        setFormError("Cần thêm bước xác minh để hoàn tất đăng nhập.");
        return;
      }

      await setActive({ session: attempt.createdSessionId });

      // Load the PandaCloud profile before routing: the landing workspace is
      // decided by active memberships, which only /auth/me knows.
      const profile = await reload();
      router.push(returnTo ?? homeForProfile(profile));
    } catch (cause) {
      // WHITELIST, không phải blacklist.
      //
      // Bản trước chỉ gộp form_identifier_not_found + form_password_incorrect,
      // mọi mã còn lại vẫn hiện nguyên văn thông điệp của Clerk. Nhưng
      // `user_locked` chỉ xảy ra với tài khoản CÓ THẬT, và
      // `strategy_for_user_invalid` chỉ xảy ra khi identifier tồn tại nhưng
      // không bật đăng nhập bằng mật khẩu — cả hai đều xác nhận email đó là
      // khách hàng. Danh sách mã lỗi của Clerk là mở, nên chặn theo danh sách
      // đen thì mã mới nào cũng tự động lọt ra.
      //
      // Chỉ những mã KHÔNG phụ thuộc vào việc tài khoản có tồn tại hay không
      // mới được hiển thị nguyên văn.
      const code = isClerkAPIResponseError(cause) ? cause.errors[0]?.code : undefined;
      setFormError(
        code && IDENTITY_NEUTRAL_ERROR_CODES.has(code)
          ? clerkErrorMessage(cause, "Email hoặc mật khẩu không đúng.")
          : "Email hoặc mật khẩu không đúng.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-base px-[24px] py-[64px]">
      <AmbientBackground />

      <AuthCard>
        <header className="flex flex-col gap-[8px]">
          <h1 className="font-sans text-[24px] font-semibold leading-[31.2px] text-ink">
            Welcome back
          </h1>
          <p className="font-sans text-[16px] leading-[25.6px] text-ink-dim">
            Log in to your Panda Cloud dashboard.
          </p>
        </header>

        <form className="flex flex-col gap-[24px]" onSubmit={handleSubmit} noValidate>
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            placeholder="jane@company.com"
            value={form.values.email}
            onChange={(e) => form.setField("email", e.target.value)}
            onBlur={() => form.blurField("email")}
            error={form.touched.email ? form.errors.email : undefined}
          />

          {verificationRequired ? (
            <Input
              label={secondFactorStrategy === "backup_code" ? "Mã dự phòng" : "Mã xác minh"}
              type="text"
              inputMode={secondFactorStrategy === "backup_code" ? "text" : "numeric"}
              autoComplete="one-time-code"
              placeholder={secondFactorStrategy === "backup_code" ? "xxxxx-xxxxx" : "123456"}
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
            />
          ) : (
            <div className="flex flex-col gap-[8px]">
              <Input
                label="Password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={form.values.password}
                onChange={(e) => form.setField("password", e.target.value)}
                onBlur={() => form.blurField("password")}
                error={form.touched.password ? form.errors.password : undefined}
              />
              {/* Mang theo email đã gõ và returnTo, để người dùng không phải
                  nhập lại và vẫn về đúng trang họ định tới sau khi đặt lại. */}
              <Link
                href={forgotPasswordHref}
                onClick={() => rememberResetEmailHint(form.values.email)}
                className="self-end font-sans text-[12px] leading-[18px] text-ink-dim underline-offset-4 hover:text-accent hover:underline"
              >
                Quên mật khẩu?
              </Link>
            </div>
          )}
          {notice ? (
            <p className="font-sans text-[12px] text-ink-dim">{notice}</p>
          ) : null}
          {formError ? (
            <p role="alert" className="font-sans text-[12px] text-red-400">
              {formError}
            </p>
          ) : null}

          {/* Clerk bot protection mounts here when the instance enables it. */}
          <div id="clerk-captcha" />

          <div className="pt-[8px]">
            <Button type="submit" variant="pill" loading={submitting} iconRight={<ArrowUpRight />}>
              {verificationRequired ? "Verify code" : "Log In"}
            </Button>
          </div>
        </form>

        <p className="pt-[8px] text-center font-sans text-[16px] leading-[25.6px] text-ink-dim">
          Need an account?{" "}
          <Link
            href={returnTo ? `/signup?returnTo=${encodeURIComponent(returnTo)}` : "/signup"}
            className="text-accent hover:underline"
          >
            Get started
          </Link>
        </p>
      </AuthCard>
    </main>
  );
}

type SecondFactorStrategy = "totp" | "phone_code" | "backup_code";

/**
 * Chọn yếu tố thứ hai trong số tài khoản THỰC SỰ đã bật.
 *
 * Ưu tiên totp (không cần mạng di động), rồi phone_code, cuối cùng backup_code
 * — backup_code là phương án cứu hộ, chỉ dùng khi không còn gì khác.
 * Trả `null` khi không có gì dùng được, để nơi gọi báo rõ thay vì rơi vào một
 * strategy không tồn tại.
 */
function pickSecondFactor(
  factors: readonly { strategy: string }[],
): SecondFactorStrategy | null {
  const available = new Set(factors.map((factor) => factor.strategy));
  if (available.has("totp")) return "totp";
  if (available.has("phone_code")) return "phone_code";
  if (available.has("backup_code")) return "backup_code";
  return null;
}

/**
 * Mã lỗi Clerk an toàn để hiển thị nguyên văn: chúng nói về YÊU CẦU, không nói
 * về việc tài khoản có tồn tại hay không. Thêm mã vào đây chỉ khi đã kiểm rằng
 * nó không xuất hiện có điều kiện theo sự tồn tại của tài khoản.
 */
const IDENTITY_NEUTRAL_ERROR_CODES = new Set([
  "form_param_format_invalid",
  "form_param_nil",
  "captcha_invalid",
  "captcha_unavailable",
  "too_many_requests",
  "session_exists",
]);

/** Figma node 2:956 — 10.34px arrow inside the primary button. */
function ArrowUpRight() {
  return (
    <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden>
      <path
        d="M2 9 9 2m0 0H3.5M9 2v5.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
