import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/session";
import { AiImportUploader } from "./import-uploader";

export const metadata: Metadata = {
  title: "AI import",
};

export default async function AiImportPage() {
  await requireUser();
  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">AI</p>
        <h1 className="text-3xl font-semibold text-slate-900">Import paper checklists</h1>
        <p className="text-sm text-slate-500">
          Upload scans, photos, or spreadsheets and let TaskFlow convert them into structured task lists.
        </p>
      </header>
      <AiImportUploader />
    </div>
  );
}
