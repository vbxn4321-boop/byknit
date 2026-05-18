import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function syncViewCounts() {
    'use server';
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return;

    // Get all patterns for the user
    const { data: patterns } = await supabase.from('patterns').select('id').eq('designer_id', user.id);

    if (!patterns) return;

    for (const p of patterns) {
        // Get count from views table
        const { count } = await supabase
            .from('pattern_views')
            .select('*', { count: 'exact', head: true })
            .eq('pattern_id', p.id);

        // Update pattern table
        await supabase
            .from('patterns')
            .update({ view_count: count || 0 })
            .eq('id', p.id);
    }

    revalidatePath('/[locale]/marketplace/dashboard', 'page');
}

export default async function DebugAnalyticsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return <div>Not logged in</div>;

    const { data: patterns } = await supabase.from('patterns').select('id, title, view_count').eq('designer_id', user.id);
    const patternIds = patterns?.map(p => p.id) || [];

    const { data: views } = await supabase
        .from('pattern_views')
        .select('*')
        .in('pattern_id', patternIds)
        .order('viewed_at', { ascending: false });

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Debug Analytics</h1>

            <form action={syncViewCounts} className="mb-8">
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700">
                    Force Sync View Counts
                </button>
            </form>

            <div className="grid grid-cols-2 gap-8">
                <div>
                    <h2 className="text-xl font-bold mb-2">Patterns (view_count check)</h2>
                    <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto h-96">
                        {JSON.stringify(patterns, null, 2)}
                    </pre>
                </div>

                <div>
                    <h2 className="text-xl font-bold mb-2">Recent Views (Timestamp check)</h2>
                    <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto h-96">
                        {JSON.stringify(views, null, 2)}
                    </pre>
                </div>
            </div>
        </div>
    );
}
