"use client";

import Link from "next/link";
import { useCallback } from "react";
import { ErrorState, Skeleton } from "@/components/ui/states";
import { useAuth } from "@/controllers/AuthContext";
import { clerkEnabled } from "@/services/config";
import { ChangePasswordForm, ProfileEditor, SessionManager } from "./AccountSecurity";
import { useAsync } from "@/controllers/useAsync";
import { api } from "@/services/api";
import type { CustomerPortfolio } from "@/models/dashboard";
import { WorkspacePage } from "./WorkspacePage";

/**
 * Bốn trang cá nhân của khách hàng: Portfolio, Wallet, Profile, Settings.
 *
 * Trước đây cả bốn đều là dữ liệu cứng gắn nhãn "Mock data". Giờ:
 *   - Portfolio đọc GET /api/v1/workspace/portfolio (tổ chức, deal đang mở,
 *     đánh giá đã trả phí, chi tiêu theo từng loại tiền).
 *   - Profile đọc profile đã có sẵn từ GET /auth/me qua AuthContext.
 *   - Wallet KHÔNG có nguồn dữ liệu (chưa có sổ cái token) → nói thẳng điều đó
 *     thay vì hiện số dư minh hoạ. Một màn hình ví hiện số tiền không có thật
 *     là loại lỗi tệ nhất trong sản phẩm tài chính.
 *   - Settings gồm hai nhóm: nhóm Clerk quản lý (mật khẩu, MFA, phiên) trỏ
 *     sang Clerk, và nhóm chưa có backend được ghi rõ là chưa khả dụng.
 */

export function PortfolioPage({ kind }: { kind: "portfolio" | "wallet" | "profile" | "settings" }) {
  if (kind === "portfolio") return <PortfolioView />;
  if (kind === "wallet") return <WalletView />;
  if (kind === "profile") return <ProfileView />;
  return <SettingsView />;
}

/* ------------------------------- Portfolio ------------------------------- */

function formatMinor(amountMinor: number, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amountMinor / 100);
}

function PortfolioView() {
  const load = useCallback(() => api.workspace.getPortfolio(), []);
  const { state, run } = useAsync(load, { immediate: [] });

  if (state.status === "error") {
    return (
      <WorkspacePage eyebrow="Customer / Portfolio" title="Portfolio" description="Tổ chức, giao dịch và quyền sử dụng gắn với tài khoản của bạn.">
        <ErrorState error={state.error} onRetry={() => void run()} />
      </WorkspacePage>
    );
  }

  if (state.status !== "success") {
    return (
      <WorkspacePage eyebrow="Customer / Portfolio" title="Portfolio" description="Tổ chức, giao dịch và quyền sử dụng gắn với tài khoản của bạn.">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-hidden>
          {[0, 1, 2, 3].map((index) => <Skeleton key={index} className="h-[96px] rounded-[24px]" />)}
        </div>
      </WorkspacePage>
    );
  }

  const data: CustomerPortfolio = state.data;
  const spend = data.spendByCurrency;

  return (
    <WorkspacePage
      eyebrow="Customer / Portfolio"
      title="Portfolio"
      description="Tổ chức, giao dịch và quyền sử dụng gắn với tài khoản của bạn."
      stats={[
        { label: "Organizations", value: String(data.totals.organizations) },
        { label: "Open Deals", value: String(data.totals.openDeals) },
        { label: "Paid Assessments", value: String(data.totals.paidAssessments) },
        { label: "Active Entitlements", value: String(data.totals.activeEntitlements) },
      ]}
    >
      {data.totals.organizations === 0 ? (
        <Panel title="Chưa có tổ chức nào">
          <p className="text-xs leading-5 text-ink-dim">
            Tài khoản của bạn chưa được gắn với tổ chức nào. Sau khi bạn gửi một yêu cầu và đội ngũ
            Panda Cloud xác nhận, dự án và giao dịch sẽ xuất hiện ở đây.
          </p>
          <Link href="/submit-request" className="mt-4 inline-block text-xs font-semibold text-accent hover:underline">
            Gửi yêu cầu →
          </Link>
        </Panel>
      ) : (
        <section className="grid gap-4 lg:grid-cols-2">
          <Panel title="Organizations">
            <ul className="flex flex-col gap-3">
              {data.organizations.map((organization) => (
                <li key={organization.id} className="flex items-center justify-between gap-3 text-xs">
                  <span className="font-medium text-ink">{organization.name}</span>
                  <span className="text-ink-dim">
                    {organization.countryCode ? `${organization.countryCode} · ` : ""}
                    {organization.status}
                  </span>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="Spend">
            {spend.length === 0 ? (
              <p className="text-xs leading-5 text-ink-dim">Chưa có khoản thanh toán nào được ghi nhận.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {/* Cộng dồn tách theo từng loại tiền — gộp USD với EUR thành một
                    con số là sai về nghiệp vụ. */}
                {spend.map((row) => (
                  <li key={row.currency} className="flex items-center justify-between text-xs">
                    <span className="text-ink-dim">{row.currency}</span>
                    <span className="font-semibold text-ink">{formatMinor(row.amountMinor, row.currency)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="Recent payments" className="lg:col-span-2">
            {data.recentPayments.length === 0 ? (
              <p className="text-xs leading-5 text-ink-dim">Chưa có giao dịch nào.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {data.recentPayments.map((payment) => (
                  <li key={payment.id} className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="text-ink-dim">
                      {new Date(payment.paidAt ?? payment.createdAt).toLocaleDateString()}
                    </span>
                    <span className="font-medium text-ink">{formatMinor(payment.amountMinor, payment.currency)}</span>
                    <span className="text-ink-dim">{payment.status}</span>
                  </li>
                ))}
              </ul>
            )}
            <Link href="/dashboard/transactions" className="mt-4 inline-block text-xs font-semibold text-accent hover:underline">
              Xem tất cả giao dịch →
            </Link>
          </Panel>
        </section>
      )}
    </WorkspacePage>
  );
}

/* -------------------------------- Wallet -------------------------------- */

function WalletView() {
  return (
    <WorkspacePage
      eyebrow="Customer / Wallet"
      title="Wallet"
      description="Số dư token và hoạt động on-chain."
    >
      {/* KHÔNG hiện số dư giả. Hệ thống chưa có bảng nào lưu số dư token, nên
          màn hình này nói đúng tình trạng đó. Khi backend có sổ cái token, thay
          khối này bằng dữ liệu thật — đừng thêm số minh hoạ vào lúc chờ. */}
      <Panel title="Chưa khả dụng">
        <p className="text-xs leading-5 text-ink-dim">
          Tính năng ví token chưa được kết nối. Hệ thống hiện chưa lưu số dư hay giao dịch on-chain
          nào, nên trang này không hiển thị số liệu — chúng tôi không muốn đưa ra một con số không
          có thật về tài sản của bạn.
        </p>
        <p className="mt-3 text-xs leading-5 text-ink-dim">
          Các khoản thanh toán đã thực hiện qua thẻ vẫn hiển thị đầy đủ ở mục{" "}
          <Link href="/dashboard/transactions" className="font-semibold text-accent hover:underline">
            Transactions
          </Link>
          .
        </p>
      </Panel>
    </WorkspacePage>
  );
}

/* -------------------------------- Profile ------------------------------- */

function ProfileView() {
  const { profile, initializing } = useAuth();

  return (
    <WorkspacePage
      eyebrow="Customer / Profile"
      title="Profile"
      description="Thông tin danh tính do Panda Cloud lưu giữ cho tài khoản của bạn."
    >
      {initializing ? (
        <div className="grid gap-4 md:grid-cols-2" aria-hidden>
          <Skeleton className="h-[180px] rounded-[24px]" />
          <Skeleton className="h-[180px] rounded-[24px]" />
        </div>
      ) : profile === null ? (
        <Panel title="Không đọc được hồ sơ">
          <p className="text-xs leading-5 text-ink-dim">
            Không tải được hồ sơ từ máy chủ. Thử tải lại trang; nếu vẫn lỗi, đăng xuất rồi đăng nhập lại.
          </p>
        </Panel>
      ) : (
        <section className="grid gap-4 md:grid-cols-2">
          <Panel title="Personal information">
            <Row label="Full name" value={profile.user.fullName} />
            <Row label="Email" value={profile.user.email} />
            <Row label="Account type" value={profile.user.userType} />
            <Row label="Status" value={profile.user.status} />
            <Row label="Member since" value={new Date(profile.user.createdAt).toLocaleDateString()} />
          </Panel>

          {/* Sửa hồ sơ đi thẳng tới Clerk; chỉ mount khi có instance Clerk, vì
              ở chế độ mock không có ClerkProvider để hook bám vào. */}
          {clerkEnabled ? (
            <Panel title="Chỉnh sửa thông tin">
              <ProfileEditor />
            </Panel>
          ) : null}

          <Panel title="Organizations">
            {profile.authorization.memberships.length === 0 ? (
              <p className="text-xs leading-5 text-ink-dim">Chưa thuộc tổ chức nào.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {profile.authorization.memberships.map((membership) => (
                  <li key={`${membership.organizationId}:${membership.role}`} className="flex items-center justify-between text-xs">
                    <span className="text-ink-dim">{membership.organizationId}</span>
                    <span className="font-semibold text-ink">{membership.role}</span>
                  </li>
                ))}
              </ul>
            )}
            {/* Tổ chức và vai trò do backend cấp từ membership; người dùng
                không tự sửa được ở đây, và đó là chủ đích. */}
            <p className="mt-4 text-[11px] leading-5 text-ink-dim">
              Tổ chức và vai trò do quản trị viên Panda Cloud cấp, không sửa được ở màn hình này.
            </p>
          </Panel>
        </section>
      )}
    </WorkspacePage>
  );
}

/* ------------------------------- Settings ------------------------------- */

function SettingsView() {
  return (
    <WorkspacePage
      eyebrow="Customer / Settings"
      title="Settings"
      description="Mật khẩu, phiên đăng nhập và tuỳ chọn tài khoản."
    >
      <section className="grid gap-4 md:grid-cols-2">
        <Panel title="Đổi mật khẩu">
          {clerkEnabled ? (
            <ChangePasswordForm />
          ) : (
            <p className="text-xs leading-5 text-ink-dim">
              Bản dựng này không cấu hình Clerk nên không có mật khẩu thật để đổi.
            </p>
          )}
        </Panel>

        <Panel title="Phiên đăng nhập">
          {clerkEnabled ? (
            <SessionManager />
          ) : (
            <p className="text-xs leading-5 text-ink-dim">
              Bản dựng này không cấu hình Clerk nên không có phiên đăng nhập nào để hiển thị.
            </p>
          )}
        </Panel>

        <Panel title="Thông báo và tuỳ chọn" className="md:col-span-2">
          {/* Không dựng công tắc bật/tắt khi backend chưa có nơi lưu: một cái
              toggle không lưu được là lời hứa suông với người dùng. */}
          <p className="text-xs leading-5 text-ink-dim">
            Chưa khả dụng. Hệ thống chưa có nơi lưu tuỳ chọn thông báo, nên trang này chưa hiển thị
            công tắc nào — một công tắc bật rồi mất khi tải lại còn tệ hơn là không có.
          </p>
        </Panel>
      </section>
    </WorkspacePage>
  );
}

/* -------------------------------- Bits ---------------------------------- */

function Panel({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <article className={`rounded-[24px] border border-line bg-surface p-6 ${className ?? ""}`}>
      <h2 className="text-sm font-semibold text-ink">{title}</h2>
      <div className="mt-4">{children}</div>
    </article>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-line-hair py-2 text-xs last:border-0">
      <span className="text-ink-dim">{label}</span>
      <span className="font-medium text-ink">{value}</span>
    </div>
  );
}
