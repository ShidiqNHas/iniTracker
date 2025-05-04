import { SupabaseSetup } from "@/components/supabase-setup"

export default function SetupPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-full max-w-md p-4">
        <h1 className="text-2xl font-bold text-center mb-6">Notion Timeline Tracker Setup</h1>
        <SupabaseSetup />
      </div>
    </div>
  )
}
