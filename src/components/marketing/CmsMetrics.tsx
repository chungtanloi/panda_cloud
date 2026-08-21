"use client";

import { useEffect, useState } from "react";
import { CountUp } from "@/components/motion/CountUp";
import { Reveal } from "@/components/motion/Reveal";
import { api } from "@/services/api";
import type { Metric } from "@/config/landing";

/**
 * Bốn ô số liệu trên trang chủ, cho phép biên tập viên sửa mà không cần deploy.
 *
 * Vì sao KHÔNG lấy từ cơ sở dữ liệu: bốn con số này ("GPUs in Operation",
 * "Ready Capacity", "Tier III+", "99.99% Guaranteed Uptime") không có bảng nào
 * trong hệ thống đếm ra được — không có sổ tồn kho GPU, không có sổ công suất,
 * không có hệ giám sát uptime. Một endpoint "thống kê" ở đây chỉ có thể trả
 * lại số do người viết mã bịa ra, và số bịa in trên trang chủ là một tuyên bố
 * thương mại sai. Nên chúng thuộc về CMS, do người chịu trách nhiệm nội dung
 * nhập và bảo đảm.
 *
 * Chiến lược hiển thị: render ngay `fallback` (nội dung tĩnh từ Figma) rồi mới
 * thay bằng bản CMS khi tải xong. Nhờ vậy HTML dựng sẵn từ máy chủ không đổi,
 * không có khoảnh khắc trống, và nếu CMS lỗi thì trang vẫn đúng như hôm nay.
 */
export function CmsMetrics({ fallback }: { fallback: readonly Metric[] }) {
  const [metrics, setMetrics] = useState<readonly Metric[]>(fallback);

  useEffect(() => {
    let cancelled = false;
    api.siteContent
      .getPublished(["landing.metrics"])
      .then((response) => {
        const parsed = parseMetrics(response.content["landing.metrics"]);
        if (!cancelled && parsed) setMetrics(parsed);
      })
      // Nuốt lỗi có chủ đích: trang chủ không được sập vì CMS không phản hồi.
      // Người dùng vẫn thấy nội dung tĩnh, vốn luôn đúng.
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="grid w-full flex-1 grid-cols-1 gap-[32px] sm:grid-cols-2">
      {metrics.map((metric, index) => (
        // key gồm cả index: parseMetrics không khử trùng lặp, nên hai mục CMS
        // cùng label sẽ tạo key trùng — React cảnh báo và có thể tái dùng sai
        // DOM node, khiến CountUp giữ lại số của mục cũ.
        <Reveal key={`${index}-${metric.label}`} delay={index * 60}>
          <div className="card-highlight hover-lift flex min-h-[142px] flex-col items-center justify-center gap-[8px] rounded-card border border-line-hair bg-card p-[25px]">
            <CountUp
              value={metric.value}
              className="text-gradient-accent text-center font-sans text-[40px] font-bold leading-[60px]"
            />
            <p className="text-center font-sans text-[16px] font-bold leading-[24px] text-ink-dim">
              {metric.label}
            </p>
          </div>
        </Reveal>
      ))}
    </div>
  );
}

/**
 * Kiểm hình dạng trước khi tin. Backend lưu JSON tự do nên bất kỳ thứ gì cũng
 * có thể tới đây; trả `null` là tín hiệu "dùng nội dung tĩnh".
 */
function parseMetrics(value: unknown): Metric[] | null {
  if (!Array.isArray(value) || value.length === 0 || value.length > 8) return null;
  const metrics: Metric[] = [];
  for (const entry of value) {
    if (typeof entry !== "object" || entry === null) return null;
    const { value: figure, label } = entry as Record<string, unknown>;
    if (typeof figure !== "string" || typeof label !== "string") return null;
    if (!figure.trim() || !label.trim() || figure.length > 32 || label.length > 64) return null;
    metrics.push({ value: figure, label });
  }
  return metrics;
}
