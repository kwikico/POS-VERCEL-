import { SupabaseStatus } from "@/components/supabase-status"

export default function TestConnectionPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Database Connection Test</h1>
          <p className="text-gray-600">Check the status of your Supabase database connection and tables</p>
        </div>

        <div className="flex justify-center">
          <SupabaseStatus />
        </div>

        <div className="mt-8 p-4 border rounded-lg bg-gray-50">
          <h3 className="font-medium mb-2">How to fix connection issues:</h3>
          <ul className="text-sm space-y-1 text-gray-700">
            <li>1. Make sure your Supabase environment variables are set correctly</li>
            <li>2. Check that your Supabase project is active and not paused</li>
            <li>3. Verify your database tables exist (products, transactions, transaction_items)</li>
            <li>4. Ensure your Supabase project has the correct RLS policies</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
