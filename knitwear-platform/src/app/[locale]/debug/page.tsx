import { createClient } from '@/utils/supabase/server';

export default async function DebugPage() {
    const supabase = await createClient();
    const { data: reviews, error: reviewsError } = await supabase.from('reviews').select('*');
    const { data: orders, error: ordersError } = await supabase.from('orders').select('*');

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();

    return (
        <div className="p-10 max-w-4xl mx-auto space-y-8">
            <h1 className="text-3xl font-bold">Debug Dashboard</h1>

            <div className="border p-4 rounded bg-gray-50">
                <h2 className="text-xl font-bold mb-2">Current User</h2>
                <pre>{JSON.stringify(user, null, 2)}</pre>
            </div>

            <div className="border p-4 rounded bg-gray-50">
                <h2 className="text-xl font-bold mb-2">Reviews Table Dump (All)</h2>
                {reviewsError && <div className="text-red-500">Error: {reviewsError.message}</div>}
                <pre className="text-xs overflow-auto max-h-60">
                    {JSON.stringify(reviews, null, 2)}
                </pre>
                <div className="mt-2">Count: {reviews?.length || 0}</div>
            </div>

            <div className="border p-4 rounded bg-gray-50">
                <h2 className="text-xl font-bold mb-2">Orders Table Dump (All)</h2>
                {ordersError && <div className="text-red-500">Error: {ordersError.message}</div>}
                <pre className="text-xs overflow-auto max-h-60">
                    {JSON.stringify(orders, null, 2)}
                </pre>
                <div className="mt-2">Count: {orders?.length || 0}</div>
            </div>
        </div>
    );
}
