"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSignIn } from "@clerk/nextjs";
import { AmbientBackground } from "@/components/layout/AmbientBackground";
import { AuthCard, ClerkNotConfigured, clerkErrorMessage } from "@/components/auth/AuthCard";
import { PasswordStrengthMeter } from "@/components/auth/PasswordStrengthMeter";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { useAuth } from "@/controllers/AuthContext";
import { homeForProfile } from "@/config/access";
import { clerkEnabled } from "@/services/config";
import { safeReturnTo } from "@/lib/returnTo";
import { consumeResetEmailHint } from "@/lib/resetEmailHint";

/**
 * Đặt lại mật khẩu — luồng `reset_password_email_code` của Clerk.
 *
 * Hai bước, cùng một `signIn` attempt:
 *   1. `signIn.create({ strategy: "reset_password_email_code", identifier })`
 *      → Clerk gửi mã 6 số tới email.
 *   2. `signIn.attemptFirstFactor({ strategy, code, password })`
 *      → Clerk đổi mật khẩu VÀ tạo phiên trong cùng một lần gọi.
 *
 * PandaCloud không tự phát hành token và không có endpoint đặt lại mật khẩu
 * nào của riêng mình — Clerk là nơi duy nhất giữ mật khẩu (xem
 * `services/endpoints.ts`, khối `auth`). Trang này chỉ điều khiển luồng của
 * Clerk bằng giao diện Panda Cloud.
 */
export default function ForgotPasswordPage() {
  // useSearchParams cần Suspense boundary dưới App Router.
  return (
    <Suspense>
      {clerkEnabled ? <ForgotPasswordView /> : <ClerkNotConfigured action="Password reset" />}
    </Suspense>
  );
}

type Step = "request" | "reset";

/** Giống trang đăng ký, để hai luồng gửi mã hành xử như nhau. */
const RESEND_COOLDOWN_SECONDS = 60;
const COOLDOWN_KEY = "pandacloud.resetCooldownUntil";

/**
 * Cooldown lưu bằng mốc thời gian hết hạn trong sessionStorage, nên tải lại
 * trang không xoá được nó. Vẫn chỉ là rào phía client — rate limit thật nằm ở
 * Clerk; đây là để tránh người dùng vô tình bấm liên tục và để cái nhãn đếm
 * ngược nói đúng sự thật.
 */
function startCooldown(): void {
  try {
    sessionStorage.setItem(COOLDOWN_KEY, String(Date.now() + RESEND_COOLDOWN_SECONDS * 1000));
  } catch {
    // Trình duyệt chặn lưu trữ: cooldown rơi về chỉ-trong-phiên-hiện-tại.
  }
}

function remainingCooldownSeconds(): number {
  try {
    const until = Number(sessionStorage.getItem(COOLDOWN_KEY) ?? "0");
    if (!Number.isFinite(until)) return 0;
    return Math.max(0, Math.ceil((until - Date.now()) / 1000));
  } catch {
    return 0;
  }
}

function ForgotPasswordView() {
  const router = useRouter();
  const params = useSearchParams();
  const { isLoaded, signIn, setActive } = useSignIn();
  const { reload, isAuthenticated } = useAuth();

  // Chống open-redirect. Luật nằm ở lib/returnTo để login/signup/forgot dùng
  // chung một bản; xem ghi chú ở đó về ca "/\evil.com".
  const returnTo = safeReturnTo(params.get("returnTo"));

  const [step, setStep] = useState<Step>("request");
  // #17: Clerk từ chối signIn.create khi đã có phiên (instance single-session),
  // và người dùng sẽ nhận một chuỗi lỗi khó hiểu không có lối thoát. Đưa họ
  // sang đúng chỗ cần đến: Cài đặt → Đổi mật khẩu.
  useEffect(() => {
    if (isAuthenticated) router.replace("/dashboard/settings");
  }, [isAuthenticated, router]);
  // Email KHÔNG đi qua query string: nó sẽ nằm lại trong lịch sử trình duyệt
  // (máy dùng chung), trong access log và trong header Referer của mọi tài
  // nguyên cross-origin mà trang này tải. sessionStorage chỉ sống trong tab.
  const [email, setEmail] = useState("");
  useEffect(() => {
    const hint = consumeResetEmailHint();
    if (hint) setEmail(hint);
  }, []);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [signOutOthers, setSignOutOthers] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [secondFactorRequired, setSecondFactorRequired] = useState(false);
  // Cùng cơ chế với trang đăng ký. Không có nó, trang này thành công cụ gửi
  // email hàng loạt tới địa chỉ bất kỳ — càng nguy vì câu trả lời cố ý trung
  // tính nên kẻ gửi không cần biết địa chỉ đó có tồn tại hay không.
  // #16: cooldown lưu theo TIMESTAMP HẾT HẠN trong sessionStorage, không phải
  // một biến đếm trong React state. State thuần bị reset khi tải lại trang,
  // nên chú thích "chống gửi email hàng loạt" của bản trước không đúng với
  // thực tế: chỉ cần F5 là gửi tiếp được.
  // Khởi tạo 0 chứ KHÔNG đọc sessionStorage ngay tại đây: component này vẫn
  // được render phía máy chủ (Next SSR cả client component), nơi không có
  // sessionStorage. Đọc trong initializer sẽ cho 0 trên server và có thể khác 0
  // trên client → hydration mismatch ở nhãn đếm ngược. Giá trị thật được nạp
  // trong effect bên dưới.
  const [cooldown, setCooldown] = useState(0);

  // #31: deps là [] và interval tự dừng khi về 0. Bản trước để deps
  // [cooldown] nên interval bị huỷ/tạo lại mỗi giây — thực chất là một chuỗi
  // setTimeout với đồng hồ reset liên tục, khiến tổng thời gian trôi DÀI hơn
  // 60s khi main thread bận.
  useEffect(() => {
    setCooldown(remainingCooldownSeconds());
    const timer = setInterval(() => setCooldown(remainingCooldownSeconds()), 1000);
    return () => clearInterval(timer);
  }, []);

  async function requestCode(event: React.FormEvent) {
    event.preventDefault();
    setFormError(null);
    setNotice(null);
    if (!isLoaded || !signIn) return;

    const identifier = email.trim();
    if (!identifier) {
      setFormError("Nhập địa chỉ email của bạn.");
      return;
    }

    setSubmitting(true);
    try {
      await signIn.create({ strategy: "reset_password_email_code", identifier });
      startCooldown();
      setCooldown(RESEND_COOLDOWN_SECONDS);
      setStep("reset");
      setNotice("Nếu email này có tài khoản, chúng tôi đã gửi mã gồm 6 chữ số tới đó.");
    } catch (cause) {
      // KHÔNG tiết lộ email nào có tài khoản. Clerk trả lỗi "không tìm thấy"
      // rất rõ ràng, và hiển thị nguyên văn sẽ biến trang này thành công cụ dò
      // xem một người có phải khách hàng hay không. Với lỗi dạng đó ta vẫn
      // chuyển sang bước nhập mã và nói câu trung tính y hệt trường hợp thành
      // công; các lỗi khác (mất mạng, quá nhiều yêu cầu) thì báo thật.
      if (isIdentifierNotFound(cause)) {
        // Vẫn tính cooldown ở nhánh này, nếu không thì thời gian chờ chính là
        // tín hiệu tiết lộ email nào có tài khoản.
        startCooldown();
        setCooldown(RESEND_COOLDOWN_SECONDS);
        setStep("reset");
        setNotice("Nếu email này có tài khoản, chúng tôi đã gửi mã gồm 6 chữ số tới đó.");
      } else {
        setFormError(clerkErrorMessage(cause, "Không gửi được mã đặt lại. Thử lại sau ít phút."));
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function resetPassword(event: React.FormEvent) {
    event.preventDefault();
    setFormError(null);
    setNotice(null);
    if (!isLoaded || !signIn || !setActive) return;

    if (!code.trim()) {
      setFormError("Nhập mã gồm 6 chữ số đã gửi tới email của bạn.");
      return;
    }
    if (password.length < 8) {
      setFormError("Mật khẩu mới phải có ít nhất 8 ký tự.");
      return;
    }
    if (password !== confirmPassword) {
      setFormError("Hai ô mật khẩu chưa khớp nhau.");
      return;
    }

    setSubmitting(true);
    try {
      // HAI lần gọi, không phải một. `attemptFirstFactor` chỉ xác minh mã và
      // trả status `needs_new_password`; mật khẩu được đặt ở `resetPassword`.
      //
      // Quan trọng: `signOutOfOtherSessions` CHỈ tồn tại trên `resetPassword`.
      // Gộp hai bước làm một rồi tự thu hồi phiên bằng tay là sai — Clerk
      // không phơi danh sách phiên ra `window.Clerk.user.sessions`, nên đoạn
      // tự chế đó im lặng không làm gì cả, trong khi ô tick vẫn nói ngược lại.
      const verified = await signIn.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code: code.trim(),
      });

      if (verified.status === "needs_second_factor") {
        // Mã email đúng, nhưng tài khoản còn yếu tố thứ hai. Mật khẩu CHƯA đổi
        // ở nhánh này (resetPassword chưa chạy) — nói đúng như vậy.
        setFormError(
          "Tài khoản của bạn cần xác minh hai lớp. Đăng nhập bằng mật khẩu hiện tại rồi đổi mật khẩu trong phần Cài đặt.",
        );
        return;
      }
      if (verified.status !== "needs_new_password") {
        // Gộp MỌI status lạ thành "mã sai" là nói dối và tạo vòng lặp không lối
        // ra: người dùng xin mã mới, nhập đúng, vẫn bị báo sai. Tách riêng.
        setFormError("Không tiếp tục được luồng đặt lại mật khẩu. Quay lại trang đăng nhập và thử lại.");
        return;
      }

      const attempt = await signIn.resetPassword({
        password,
        signOutOfOtherSessions: signOutOthers,
      });

      // Tài khoản bật xác thực hai lớp: mật khẩu ĐÃ đổi, nhưng phiên chưa được
      // tạo cho tới khi qua yếu tố thứ hai. Đưa người dùng về trang đăng nhập
      // và nói rõ điều đó, thay vì để họ tưởng thao tác thất bại.
      if (attempt.status === "needs_second_factor") {
        setSecondFactorRequired(true);
        return;
      }

      if (attempt.status !== "complete" || !attempt.createdSessionId) {
        setFormError("Không hoàn tất được việc đặt lại mật khẩu. Yêu cầu mã mới rồi thử lại.");
        return;
      }

      await setActive({ session: attempt.createdSessionId });

      const profile = await reload();
      router.replace(returnTo ?? homeForProfile(profile));
    } catch (cause) {
      setFormError(clerkErrorMessage(cause, "Mã không đúng hoặc đã hết hạn. Yêu cầu mã mới."));
    } finally {
      setSubmitting(false);
    }
  }

  async function resendCode() {
    setFormError(null);
    setNotice(null);
    if (!isLoaded || !signIn || cooldown > 0) return;
    setSubmitting(true);
    try {
      await signIn.create({ strategy: "reset_password_email_code", identifier: email.trim() });
      startCooldown();
      setCooldown(RESEND_COOLDOWN_SECONDS);
      setNotice("Đã gửi lại mã.");
    } catch (cause) {
      if (isIdentifierNotFound(cause)) {
        // Chỉ đặt cooldown khi Clerk THỰC SỰ đã nhận yêu cầu (kể cả khi email
        // không tồn tại — im lặng là có chủ đích). Lỗi mạng thì không: khoá
        // người dùng 60s vì rớt mạng một lần là phạt nhầm người.
        startCooldown();
        setCooldown(RESEND_COOLDOWN_SECONDS);
        setNotice("Đã gửi lại mã.");
      } else {
        setFormError(clerkErrorMessage(cause, "Không gửi lại được mã. Thử lại sau ít phút."));
      }
    } finally {
      setSubmitting(false);
    }
  }

  const loginHref = returnTo ? `/login?returnTo=${encodeURIComponent(returnTo)}` : "/login";

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-base px-[24px] py-[64px]">
      <AmbientBackground />

      <AuthCard>
        {secondFactorRequired ? (
          <>
            <header className="flex flex-col gap-[8px]">
              <h1 className="font-sans text-[24px] font-semibold leading-[31.2px] text-ink">
                Đã đổi mật khẩu
              </h1>
              <p className="font-sans text-[16px] leading-[25.6px] text-ink-dim">
                Tài khoản của bạn bật xác thực hai lớp, nên hãy đăng nhập lại bằng mật khẩu mới để
                hoàn tất bước xác minh.
              </p>
            </header>
            <Link
              href={loginHref}
              className="inline-flex justify-center rounded-full border border-line-strong px-[22px] py-[10px] font-sans text-[12px] font-medium leading-[18px] text-ink transition-colors hover:border-accent hover:text-accent"
            >
              Về trang đăng nhập
            </Link>
          </>
        ) : step === "request" ? (
          <>
            <header className="flex flex-col gap-[8px]">
              <h1 className="font-sans text-[24px] font-semibold leading-[31.2px] text-ink">
                Quên mật khẩu?
              </h1>
              <p className="font-sans text-[16px] leading-[25.6px] text-ink-dim">
                Nhập email của bạn, chúng tôi sẽ gửi mã để đặt lại mật khẩu.
              </p>
            </header>

            <form className="flex flex-col gap-[24px]" onSubmit={requestCode} noValidate>
              <Input
                label="Email"
                type="email"
                autoComplete="email"
                placeholder="jane@company.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />

              {formError ? (
                <p role="alert" className="font-sans text-[12px] text-red-400">{formError}</p>
              ) : null}

              {/* Clerk gắn bot protection ở đây khi instance bật tính năng đó. */}
              <div id="clerk-captcha" />

              <div className="pt-[8px]">
                <Button type="submit" variant="pill" loading={submitting}>
                  Gửi mã đặt lại
                </Button>
              </div>
            </form>
          </>
        ) : (
          <>
            <header className="flex flex-col gap-[8px]">
              <h1 className="font-sans text-[24px] font-semibold leading-[31.2px] text-ink">
                Đặt mật khẩu mới
              </h1>
              <p className="font-sans text-[16px] leading-[25.6px] text-ink-dim">
                Nhập mã đã gửi tới <span className="text-ink">{email}</span> và chọn mật khẩu mới.
              </p>
            </header>

            <form className="flex flex-col gap-[24px]" onSubmit={resetPassword} noValidate>
              <Input
                label="Mã xác minh"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="123456"
                value={code}
                onChange={(event) => setCode(event.target.value)}
              />

              <div className="flex flex-col gap-[12px]">
                <Input
                  label="Mật khẩu mới"
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
                <PasswordStrengthMeter password={password} />
              </div>

              <Input
                label="Nhập lại mật khẩu mới"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
              />

              <label className="flex items-start gap-[10px] font-sans text-[12px] leading-[18px] text-ink-dim">
                <input
                  type="checkbox"
                  checked={signOutOthers}
                  onChange={(event) => setSignOutOthers(event.target.checked)}
                  className="mt-[2px] h-[14px] w-[14px] accent-[color:var(--color-accent)]"
                />
                <span>
                  Đăng xuất khỏi mọi thiết bị khác. Bật mặc định: nếu mật khẩu cũ đã bị lộ, phiên
                  của người khác vẫn còn hiệu lực cho tới khi bị thu hồi.
                </span>
              </label>

              {notice ? (
                <p className="font-sans text-[12px] text-ink-dim">{notice}</p>
              ) : null}
              {formError ? (
                <p role="alert" className="font-sans text-[12px] text-red-400">{formError}</p>
              ) : null}

              <div className="flex flex-col gap-[12px] pt-[8px]">
                <Button type="submit" variant="pill" loading={submitting}>
                  Đặt lại mật khẩu
                </Button>
                {/* #18: gõ nhầm email thì mã không bao giờ tới, mà resendCode
                    lại gửi đúng cái email sai đó. Phải có đường lùi — trang
                    đăng ký cũng có nút "Use a different email" cho đúng ca này. */}
                <button
                  type="button"
                  onClick={() => { setStep("request"); setCode(""); setFormError(null); setNotice(null); }}
                  disabled={submitting}
                  className="font-sans text-[12px] text-ink-dim underline-offset-4 hover:text-accent hover:underline disabled:opacity-50"
                >
                  Dùng email khác
                </button>
                <button
                  type="button"
                  onClick={() => void resendCode()}
                  disabled={submitting || cooldown > 0}
                  className="font-sans text-[12px] text-ink-dim underline-offset-4 hover:text-accent hover:underline disabled:opacity-50"
                >
                  {cooldown > 0 ? `Gửi lại mã sau ${cooldown}s` : "Gửi lại mã"}
                </button>
              </div>
            </form>
          </>
        )}

        <p className="pt-[8px] text-center font-sans text-[16px] leading-[25.6px] text-ink-dim">
          Nhớ ra mật khẩu rồi?{" "}
          <Link href={loginHref} className="text-accent hover:underline">
            Đăng nhập
          </Link>
        </p>
      </AuthCard>
    </main>
  );
}

/**
 * Nhận diện lỗi "không có tài khoản nào khớp".
 *
 * Dùng để giữ câu trả lời trung tính ở bước 1 — xem ghi chú trong requestCode.
 * So khớp theo mã lỗi của Clerk, không theo chuỗi tiếng Anh, vì chuỗi đó thay
 * đổi được còn mã thì không.
 */
function isIdentifierNotFound(cause: unknown): boolean {
  const errors = (cause as { errors?: { code?: string }[] } | null)?.errors;
  if (!Array.isArray(errors)) return false;
  return errors.some((error) => error.code === "form_identifier_not_found");
}
