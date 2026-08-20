"use client";

import type { SubmissionContact } from "@/models/submission";

export function CustomerContactFields({ value, onChange }: { value: SubmissionContact; onChange: (value: SubmissionContact) => void }) {
  const update = (field: keyof SubmissionContact, next: string) => onChange({ ...value, [field]: next });
  const emailInvalid = value.email.trim().length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email.trim());
  return (
    <section className="rounded-card border border-line-hair bg-card p-[20px]">
      <h2 className="font-sans text-[16px] font-semibold text-white">Thông tin liên hệ</h2>
      <p className="mt-[5px] text-[12px] leading-[18px] text-ink-dim">Không cần tạo tài khoản. Sales sẽ dùng thông tin này để liên hệ với bạn.</p>
      <div className="mt-[14px] grid grid-cols-1 gap-[10px] sm:grid-cols-2">
        <input required value={value.fullName} onChange={(e) => update("fullName", e.target.value)} placeholder="Họ và tên *" className="rounded-field border border-line-strong bg-deep px-[12px] py-[10px] text-[13px] text-ink placeholder:text-ink-faint" />
        <div className="flex flex-col gap-[4px]">
          <input required type="email" aria-invalid={emailInvalid} value={value.email} onChange={(e) => update("email", e.target.value)} placeholder="Email công việc *" className="rounded-field border border-line-strong bg-deep px-[12px] py-[10px] text-[13px] text-ink placeholder:text-ink-faint" />
          {emailInvalid ? <span className="font-sans text-[10px] text-red-300">Vui lòng nhập email hợp lệ, ví dụ name@company.com.</span> : null}
        </div>
        <input value={value.companyName ?? ""} onChange={(e) => update("companyName", e.target.value)} placeholder="Công ty / tổ chức" className="rounded-field border border-line-strong bg-deep px-[12px] py-[10px] text-[13px] text-ink placeholder:text-ink-faint" />
        <input value={value.phone ?? ""} onChange={(e) => update("phone", e.target.value)} placeholder="Số điện thoại" className="rounded-field border border-line-strong bg-deep px-[12px] py-[10px] text-[13px] text-ink placeholder:text-ink-faint" />
      </div>
    </section>
  );
}
