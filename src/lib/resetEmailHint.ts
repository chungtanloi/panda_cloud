/**
 * Chuyển email người dùng vừa gõ từ trang đăng nhập sang trang quên mật khẩu,
 * mà không đưa nó vào URL.
 *
 * Vì sao không dùng query string: email sẽ nằm lại trong lịch sử trình duyệt
 * (vấn đề thật trên máy dùng chung), trong access log của server, và trong
 * header `Referer` của mọi tài nguyên cross-origin mà trang đích tải. Đây chỉ
 * là tiện ích đỡ phải gõ lại — không đáng đánh đổi bằng ba chỗ rò rỉ đó.
 *
 * `sessionStorage` chỉ sống trong tab hiện tại, và giá trị được ĐỌC MỘT LẦN
 * rồi xoá ngay, nên nó không đọng lại cho lần mở trang sau.
 */
const KEY = "pandacloud.resetEmailHint";

export function rememberResetEmailHint(email: string): void {
  try {
    const trimmed = email.trim();
    if (trimmed) sessionStorage.setItem(KEY, trimmed);
  } catch {
    // Chế độ riêng tư hoặc trình duyệt chặn lưu trữ. Người dùng chỉ phải gõ
    // lại email — không có lý do gì để chặn luồng vì chuyện này.
  }
}

export function consumeResetEmailHint(): string | null {
  try {
    const value = sessionStorage.getItem(KEY);
    if (value) sessionStorage.removeItem(KEY);
    return value;
  } catch {
    return null;
  }
}
