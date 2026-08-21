"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession, useUser } from "@clerk/nextjs";
import { clerkErrorMessage } from "@/components/auth/AuthCard";
import { PasswordStrengthMeter } from "@/components/auth/PasswordStrengthMeter";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { Skeleton } from "@/components/ui/states";
import { useAuth } from "@/controllers/AuthContext";

/**
 * Đổi mật khẩu, sửa hồ sơ và quản lý phiên đăng nhập.
 *
 * Mọi thao tác ở đây đi thẳng tới Clerk, KHÔNG qua `/api/v1`. Lý do: Clerk là
 * nơi duy nhất giữ mật khẩu và phiên; PandaCloud không phát hành token và
 * không có endpoint nào cho các thao tác này (xem khối `auth` trong
 * `services/endpoints.ts`). Dựng thêm một đường vòng qua BFF sẽ tạo ra một bản
 * sao thứ hai của sự thật về danh tính — đúng loại lệch dữ liệu khó gỡ nhất.
 *
 * Họ tên thì có hai nơi lưu: Clerk (nguồn) và bảng `users` của Convex (bản
 * sao, đồng bộ qua webhook `user.updated`). Vì thế sau khi lưu tên, phần hiển
 * thị trong ứng dụng có thể chậm vài giây — thành phần này nói rõ điều đó thay
 * vì để người dùng tưởng thao tác không ăn.
 *
 * Chỉ mount khi `clerkEnabled` là true. Ở chế độ mock không có ClerkProvider
 * nên `useUser()` sẽ ném lỗi.
 */

export function ProfileEditor() {
  const { isLoaded, user } = useUser();
  const { reload } = useAuth();
  const [fullName, setFullName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Nạp giá trị ban đầu MỘT LẦN cho mỗi tài khoản.
  //
  // deps [isLoaded, user] là sai: useUser() trả về một object `user` MỚI mỗi
  // lần Clerk làm mới resource (poll, focus lại tab, refresh token), không chỉ
  // khi tên đổi. Mỗi lần như vậy effect chạy lại và ném giá trị máy chủ đè lên
  // chữ người dùng đang gõ dở. user?.id là giá trị nguyên thuỷ, chỉ đổi khi
  // thực sự sang tài khoản khác.
  useEffect(() => {
    setFullName(user?.fullName ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  if (!isLoaded) return <Skeleton className="h-[160px] rounded-[24px]" />;
  if (!user) return null;

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    const trimmed = fullName.trim();
    if (!trimmed) {
      setError("Họ tên không được để trống.");
      return;
    }
    if (trimmed.length > 200) {
      setError("Họ tên tối đa 200 ký tự.");
      return;
    }

    setSaving(true);
    try {
      // Cùng quy ước tách tên với trang đăng ký: từ đầu là firstName, phần còn
      // lại là lastName. Lệch quy ước giữa hai nơi sẽ khiến tên bị đảo sau lần
      // sửa đầu tiên.
      //
      // Dùng CHUỖI RỖNG chứ không phải `undefined`: Clerk bỏ qua mọi key có
      // giá trị undefined khi dựng request, nên field đó giữ nguyên giá trị cũ.
      // Hậu quả cụ thể nếu dùng undefined: "Nguyễn Văn A" sửa thành "An" sẽ gửi
      // { firstName: "An", lastName: undefined } → Clerk giữ lastName cũ →
      // fullName thành "An Văn A", và useEffect nạp ngược chuỗi đó vào ô nhập.
      // Người dùng không bao giờ rút tên xuống một từ được.
      const [firstName, ...rest] = trimmed.split(/\s+/);
      await user!.update({ firstName, lastName: rest.join(" ") });
      await reload();
      setNotice("Đã lưu. Tên hiển thị trong hệ thống có thể mất vài giây để đồng bộ.");
    } catch (cause) {
      setError(clerkErrorMessage(cause, "Không lưu được họ tên. Thử lại."));
    } finally {
      setSaving(false);
    }
  }

  const emailVerified = user.primaryEmailAddress?.verification?.status === "verified";

  return (
    <form className="flex flex-col gap-[16px]" onSubmit={save} noValidate>
      <Input
        label="Họ và tên"
        type="text"
        autoComplete="name"
        value={fullName}
        onChange={(event) => setFullName(event.target.value)}
      />

      <div className="flex flex-col gap-[6px]">
        <Input
          label="Email"
          type="email"
          value={user.primaryEmailAddress?.emailAddress ?? ""}
          readOnly
          disabled
        />
        {/* Email là định danh đăng nhập. Đổi email làm thay đổi cả cách xác
            thực lẫn cách hệ thống nhận diện người dùng, nên nó thuộc luồng
            xác minh riêng của Clerk chứ không phải một ô nhập ở đây. */}
        <p className="font-sans text-[11px] leading-[16px] text-ink-dim">
          {emailVerified ? "Email đã được xác minh." : "Email chưa được xác minh."} Việc đổi email
          cần đi qua bước xác minh riêng và chưa mở ở màn hình này.
        </p>
      </div>

      {notice ? <p className="font-sans text-[12px] text-accent">{notice}</p> : null}
      {error ? <p role="alert" className="font-sans text-[12px] text-red-400">{error}</p> : null}

      <div>
        <Button type="submit" variant="pill" loading={saving}>Lưu thay đổi</Button>
      </div>
    </form>
  );
}

/* ---------------------------- Đổi mật khẩu ---------------------------- */

export function ChangePasswordForm() {
  const { isLoaded, user } = useUser();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [signOutOthers, setSignOutOthers] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  if (!isLoaded) return <Skeleton className="h-[220px] rounded-[24px]" />;
  if (!user) return null;

  // Tài khoản đăng nhập bằng Google/SSO không có mật khẩu để đổi. Hiện form
  // trong trường hợp đó chỉ dẫn tới một lỗi khó hiểu.
  if (!user.passwordEnabled) {
    return (
      <p className="font-sans text-[12px] leading-[20px] text-ink-dim">
        Tài khoản này đăng nhập qua nhà cung cấp bên ngoài nên không có mật khẩu riêng để đổi.
        Hãy đổi mật khẩu ở chính nhà cung cấp đó.
      </p>
    );
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setNotice(null);

    if (!currentPassword) {
      setError("Nhập mật khẩu hiện tại.");
      return;
    }
    if (newPassword.length < 8) {
      setError("Mật khẩu mới phải có ít nhất 8 ký tự.");
      return;
    }
    if (newPassword === currentPassword) {
      setError("Mật khẩu mới phải khác mật khẩu hiện tại.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Hai ô mật khẩu mới chưa khớp nhau.");
      return;
    }

    setSaving(true);
    try {
      await user!.updatePassword({
        currentPassword,
        newPassword,
        // Mặc định thu hồi phiên khác: nếu lý do đổi mật khẩu là nghi bị lộ,
        // để phiên cũ sống tiếp thì việc đổi gần như vô nghĩa.
        signOutOfOtherSessions: signOutOthers,
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setNotice(
        signOutOthers
          ? "Đã đổi mật khẩu và đăng xuất khỏi các thiết bị khác."
          : "Đã đổi mật khẩu.",
      );
    } catch (cause) {
      setError(clerkErrorMessage(cause, "Không đổi được mật khẩu. Kiểm tra lại mật khẩu hiện tại."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="flex flex-col gap-[16px]" onSubmit={save} noValidate>
      <Input
        label="Mật khẩu hiện tại"
        type="password"
        autoComplete="current-password"
        placeholder="••••••••"
        value={currentPassword}
        onChange={(event) => setCurrentPassword(event.target.value)}
      />

      <div className="flex flex-col gap-[10px]">
        <Input
          label="Mật khẩu mới"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
        />
        <PasswordStrengthMeter password={newPassword} />
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
        <span>Đăng xuất khỏi mọi thiết bị khác sau khi đổi.</span>
      </label>

      {notice ? <p className="font-sans text-[12px] text-accent">{notice}</p> : null}
      {error ? <p role="alert" className="font-sans text-[12px] text-red-400">{error}</p> : null}

      <div>
        <Button type="submit" variant="pill" loading={saving}>Đổi mật khẩu</Button>
      </div>
    </form>
  );
}

/* ------------------------- Phiên đăng nhập ------------------------- */

interface SessionRow {
  id: string;
  current: boolean;
  device: string;
  lastActiveAt: string | null;
}

export function SessionManager() {
  const { isLoaded, user } = useUser();
  // Lấy phiên hiện tại từ hook, KHÔNG từ globalThis.Clerk. Biến global có thể
  // chưa được gắn khi load() chạy → currentId undefined → không phiên nào được
  // đánh dấu "(thiết bị này)" → nút "Thu hồi" hiện trên chính phiên đang dùng,
  // người dùng bấm và tự đăng xuất mình.
  const { session } = useSession();
  const currentId = session?.id;
  const [sessions, setSessions] = useState<SessionRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [revoking, setRevoking] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setError(null);
    try {
      const list = await user.getSessions();
      setSessions(
        // Đổi tên tham số để không che biến `session` của useSession ở trên —
        // che biến ở đây là kiểu nhầm lẫn rất dễ dẫn tới so sánh một phiên với
        // chính nó.
        list.map((entry) => ({
          id: entry.id,
          current: entry.id === currentId,
          device: describeDevice(entry),
          lastActiveAt: entry.lastActiveAt ? new Date(entry.lastActiveAt).toISOString() : null,
        })),
      );
    } catch (cause) {
      setError(clerkErrorMessage(cause, "Không tải được danh sách phiên đăng nhập."));
    }
  }, [user, currentId]);

  useEffect(() => { if (isLoaded && user) void load(); }, [isLoaded, user, load]);

  if (!isLoaded) return <Skeleton className="h-[140px] rounded-[24px]" />;
  if (!user) return null;

  async function revoke(sessionId: string) {
    setRevoking(sessionId);
    setError(null);
    try {
      const list = await user!.getSessions();
      const target = list.find((session) => session.id === sessionId);
      await target?.revoke();
      await load();
    } catch (cause) {
      setError(clerkErrorMessage(cause, "Không thu hồi được phiên này."));
    } finally {
      setRevoking(null);
    }
  }

  if (sessions === null) {
    return error
      ? <p role="alert" className="font-sans text-[12px] text-red-400">{error}</p>
      : <Skeleton className="h-[140px] rounded-[24px]" />;
  }

  // Lỗi hiện KÈM danh sách, không thay thế nó. Nếu thu hồi một phiên thất bại
  // mà cả danh sách biến mất, người dùng mất luôn khả năng thử lại — đúng vào
  // lúc họ đang cố đá một thiết bị lạ ra khỏi tài khoản.
  return (
    <>
    {error ? <p role="alert" className="pb-[10px] font-sans text-[12px] text-red-400">{error}</p> : null}
    <ul className="flex flex-col gap-[12px]">
      {sessions.map((session) => (
        <li key={session.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-line-hair pb-[10px] text-xs last:border-0 last:pb-0">
          <div className="flex flex-col gap-[2px]">
            <span className="font-medium text-ink">
              {session.device}
              {session.current ? <span className="ml-2 text-accent">(thiết bị này)</span> : null}
            </span>
            <span className="text-ink-dim">
              {session.lastActiveAt
                ? `Hoạt động lần cuối ${new Date(session.lastActiveAt).toLocaleString()}`
                : "Chưa có dữ liệu hoạt động"}
            </span>
          </div>
          {/* Không cho thu hồi phiên hiện tại từ đây: nó chỉ là đăng xuất, và
              đã có nút Đăng xuất riêng. Đặt nhầm ở đây dễ khiến người dùng bấm
              trong lúc đang định thu hồi thiết bị khác. */}
          {session.current ? null : (
            <button
              type="button"
              onClick={() => void revoke(session.id)}
              disabled={revoking === session.id}
              className="rounded-full border border-line-strong px-[14px] py-[6px] font-sans text-[11px] font-medium text-ink transition-colors hover:border-red-400 hover:text-red-400 disabled:opacity-50"
            >
              {revoking === session.id ? "Đang thu hồi…" : "Thu hồi"}
            </button>
          )}
        </li>
      ))}
    </ul>
    </>
  );
}

/** Mô tả thiết bị từ dữ liệu Clerk có gì dùng nấy; không đoán thêm. */
function describeDevice(session: { latestActivity?: { browserName?: string; deviceType?: string; city?: string; country?: string } | null }): string {
  const activity = session.latestActivity;
  if (!activity) return "Thiết bị không xác định";
  const parts = [activity.browserName, activity.deviceType].filter(Boolean);
  const place = [activity.city, activity.country].filter(Boolean).join(", ");
  const device = parts.length > 0 ? parts.join(" · ") : "Thiết bị không xác định";
  return place ? `${device} — ${place}` : device;
}
