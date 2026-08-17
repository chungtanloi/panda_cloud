"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { WorkspacePage } from "@/components/workspace/WorkspacePage";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states";
import { Select } from "@/components/ui/Field";
import { StatusPill } from "@/components/workspace/StatusPill";
import { api, normalizeError } from "@/services/api";
import type { Submission, SubmissionStatus } from "@/models";
import type { NormalizedError } from "@/models/common";

const statuses: readonly (SubmissionStatus | "all")[] = ["all","new","qualified","converted","disqualified","nurture","archived"];
export function SubmissionsPage() {
 const [items,setItems]=useState<Submission[]>([]); const [status,setStatus]=useState<SubmissionStatus|"all">("all"); const [cursor,setCursor]=useState<string|null>(null); const [done,setDone]=useState(false); const [loading,setLoading]=useState(true); const [error,setError]=useState<NormalizedError|null>(null);
 const load=useCallback(async(reset:boolean)=>{setLoading(true);setError(null);try{const page=await api.submissions.list({...(status!=="all"?{status}:{}),...(reset||!cursor?{}:{cursor})});setItems((prev)=>reset?Array.from(page.leads):[...prev,...page.leads]);setCursor(page.continueCursor);setDone(page.isDone);}catch(cause){setError(normalizeError(cause));}finally{setLoading(false);}},[status,cursor]);
 useEffect(()=>{void load(true);},[load,status]);
 return <WorkspacePage eyebrow="Sales / CRM" title="Submissions" description="Inbound requests remain leads until an authorized staff member converts them into a deal.">
  <div className="mb-6 max-w-[320px]"><Select label="Status" value={status} onChange={(e)=>setStatus(e.target.value as SubmissionStatus|"all")} options={statuses.map((value)=>({value,label:value==="all"?"All statuses":value.replace("_"," ")}))}/></div>
  {loading&&items.length===0?<LoadingState label="Loading submissions"/>:null}
  {error?<ErrorState error={error} onRetry={()=>void load(items.length===0)}/>:null}
  {!loading&&!error&&items.length===0?<EmptyState title="No submissions" message="New public requests will appear here when the backend receives them."/>:null}
  {items.length>0?<ul className="grid gap-3">{items.map((item)=><li key={item.leadId}><Link href={"/sales/leads/"+item.leadId} className="block rounded-[20px] border border-line bg-surface p-5 hover:border-accent/40"><div className="flex items-center justify-between gap-3"><div><p className="text-sm font-semibold text-ink">{item.summary||"Untitled submission"}</p><p className="mt-1 text-xs text-ink-dim">{item.source} · {item.vertical||"unclassified"}</p></div><StatusPill label={item.status.replace("_"," ")} tone={item.status==="converted"?"good":item.status==="disqualified"||item.status==="archived"?"neutral":"waiting"}/></div><p className="mt-3 text-[11px] text-ink-faint">Updated {new Date(item.updatedAt).toLocaleString()}</p></Link></li>)}</ul>:null}
  {!done&&cursor&&!error?<button type="button" onClick={()=>void load(false)} disabled={loading} className="mt-6 rounded-full border border-line px-4 py-2 text-xs font-bold uppercase tracking-wider text-ink-dim disabled:opacity-50">{loading?"Loading…":"Load more"}</button>:null}
 </WorkspacePage>;
}