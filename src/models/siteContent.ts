/**
 * Nội dung marketing sửa được qua khu vực quản trị.
 *
 * Backend trả về một túi khoá → giá trị JSON tuỳ hình dạng. Frontend KHÔNG tin
 * hình dạng đó: mỗi nơi tiêu thụ phải tự kiểm và rơi về nội dung tĩnh trong
 * `config/*.ts` khi không khớp. Một dấu phẩy sai trong CMS không được phép làm
 * hỏng trang chủ.
 */
export interface SiteContentResponse {
  content: Record<string, unknown>;
}

export interface SiteContentEntry {
  id: string;
  key: string;
  /** JSON đã tuần tự hoá. */
  value: string;
  status: "draft" | "published";
  revision: number;
  updatedAt: string;
}

export interface SiteContentUpsertRequest {
  key: string;
  value: string;
  status: "draft" | "published";
  expectedRevision?: number;
}
