"use client";
import dynamic from "next/dynamic";
import { LoadingState } from "@/components/ui/states";
const SalesBoard = dynamic(() => import("@/components/sales/SalesBoard").then((module) => module.SalesBoard), { ssr: false, loading: () => <LoadingState label="Loading pipeline" /> });
export function PipelinePage() { return <main className="box-border h-screen min-w-0 overflow-hidden p-5 pt-20 lg:p-8"><SalesBoard /></main>; }
