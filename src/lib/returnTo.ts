/**
 * Kiểm tra tham số `returnTo` trước khi điều hướng.
 *
 * Chỉ chấp nhận đường dẫn tương đối cùng origin. Ba dạng bị chặn:
 *   - `//evil.com`  → trình duyệt hiểu là protocol-relative URL sang host khác.
 *   - `/\evil.com`  → dấu `\` được chuẩn hoá thành `/`, nên nó tương đương `//`.
 *     Cách kiểm cũ (`startsWith("/") && !startsWith("//")`) để lọt dạng này.
 *   - Ký tự khoảng trắng / điều khiển → dùng để lách bộ lọc.
 *
 * Đặt ở một nơi vì login, signup và forgot-password đều cần đúng luật này;
 * ba bản sao của một biểu thức bảo mật thì chỉ cần quên sửa một chỗ là thủng.
 */
/**
 * Các trang xác thực không bao giờ là đích hợp lệ.
 *
 * `/login?returnTo=%2Flogin` sẽ tạo vòng lặp: đăng nhập xong push("/login") →
 * vẫn ở /login → useEffect thấy đã đăng nhập → replace("/login") → lặp lại,
 * gọi GET /auth/me liên tục.
 */
const AUTH_ROUTES = ["/login", "/signup", "/forgot-password", "/choose-path"];

export function safeReturnTo(raw: string | null | undefined): string | null {
  if (!raw) return null;
  // Phải bắt đầu bằng "/", ký tự kế tiếp không được là "/" hay "\",
  // và toàn chuỗi không chứa "\" hay khoảng trắng.
  if (!/^\/(?![/\\])[^\s\\]*$/.test(raw)) return null;
  const path = raw.split(/[?#]/)[0]!.replace(/\/+$/, "") || "/";
  if (AUTH_ROUTES.includes(path.toLowerCase())) return null;
  return raw;
}
