'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { translatePatternMetadata } from './translate';

export async function saveGridProject(data: any) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            console.error('Auth Error:', authError);
            return { error: 'Unauthorized: ' + (authError?.message || 'No user found') };
        }

        // Check if project exists
        let projectId = data.id;

        const payload = {
            user_id: user.id,
            title: data.title || 'Untitled Project',
            grid_data: data.grid,
            palette: data.palette,
            gauge: data.gauge || { stitches: 10, rows: 10 },
            width: data.width,
            height: data.height,
            original_image_url: data.originalImage || null,
            updated_at: new Date().toISOString()
        };

        let result;

        if (projectId) {
            // Update
            const { data: updated, error: updateError } = await supabase
                .from('grid_projects')
                .update(payload)
                .eq('id', projectId)
                .select()
                .single();

            if (updateError) throw updateError;
            result = updated;
        } else {
            // Insert
            const { data: inserted, error: insertError } = await supabase
                .from('grid_projects')
                .insert(payload)
                .select()
                .single();

            if (insertError) throw insertError;
            result = inserted;
        }

        // Revalidate the studio page to show the new project
        revalidatePath('/studio');

        return { success: true, project: result };
    } catch (e: any) {
        console.error('Server Action Error:', e);
        return { error: e.message || 'An unexpected error occurred' };
    }
}

export async function deleteGridProject(projectId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'Unauthorized' };
    }

    const { error } = await supabase
        .from('grid_projects')
        .delete()
        .eq('id', projectId)
        .eq('user_id', user.id); // Security: ensure user owns the project

    if (error) {
        console.error('Delete Project Error:', error);
        return { error: error.message };
    }

    revalidatePath('/studio');
    return { success: true };
}

export async function getMyProjects() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { projects: [], error: 'Unauthorized' };

    try {
        console.log('Fetching projects for user:', user.id);
        const { data: projects, error } = await supabase
            .from('grid_projects')
            .select('*')
            .eq('user_id', user.id)
            .order('updated_at', { ascending: false });

        if (error) {
            console.error('Get Projects Error (Query):', {
                code: error.code,
                message: error.message,
                details: error.details,
                hint: error.hint,
                keys: Object.keys(error)
            });
            return { projects: [], error: error.message };
        }

        return { projects: projects || [] };
    } catch (err: any) {
        console.error('Get Projects Error (Catch):', err);
        return { projects: [], error: err.message || 'Internal Server Error' };
    }
}

export async function getGridProject(id: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { project: null, error: 'Unauthorized' };

    const { data: project, error } = await supabase
        .from('grid_projects')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

    if (error) {
        console.error('Get Project Error:', error);
        return { project: null, error: error.message };
    }

    return { project };
}

export async function publishPattern(projectId: string, metadata: {
    price: number;
    category: string;
    difficulty: string;
    briefDescription: string;      // Product page description
    detailedDescription?: string;  // PDF-only written pattern
    title: string;
    imageUrl?: string;
    additionalImages?: string[];
    subcategory?: string;
    craftType?: 'knitting' | 'crochet' | 'mixed' | 'other';
    yarnWeight?: string;
    yardage?: string | number;     // Now string allowed
    needles: string;               // Required
    gaugeStitches: string | number; // Now string allowed
    gaugeRows?: string | number;             // Optional/Legacy
    usedColors?: string[];         // Auto-populated from grid
    hashtags?: string[];           // Required: min 3, max 10
    yarnParts?: any[];             // New Part-based yarn info
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: 'Unauthorized' };

    // 1. Get Project Data
    const { data: project, error: fetchError } = await supabase
        .from('grid_projects')
        .select('*')
        .eq('id', projectId)
        .single();

    if (fetchError || !project) return { error: 'Project not found' };

    // 2. Translate title and descriptions to both languages using AI
    const translated = await translatePatternMetadata({
        title: metadata.title,
        briefDescription: metadata.briefDescription,
        detailedDescription: metadata.detailedDescription
    });

    // 3. Create Pattern Record
    // Convert new gauge format to string for DB storage
    const gaugeString = typeof metadata.gaugeStitches === 'string'
        ? metadata.gaugeStitches
        : `${metadata.gaugeStitches}코 ${metadata.gaugeRows || 0}단`;

    const { data: pattern, error: insertError } = await supabase
        .from('patterns')
        .insert({
            designer_id: user.id,
            type: 'internal_pdf', // It's generated from grid
            title: translated.title,
            description: translated.description,
            price_usd: metadata.price,
            category: metadata.category,
            difficulty: metadata.difficulty,
            thumbnail_url: metadata.imageUrl || project.original_image_url,
            images: [
                metadata.imageUrl || project.original_image_url,
                ...(metadata.additionalImages || [])
            ].filter(Boolean),
            subcategory: metadata.subcategory,
            craft_type: metadata.craftType,
            yarn_weight: metadata.yarnWeight,
            yardage: metadata.yardage,
            needles: metadata.needles,
            gauge: gaugeString,
            // TODO: Uncomment after adding 'hashtags' column to patterns table
            // hashtags: metadata.hashtags || [],
            // Grid data for PDF generation
            grid_data: project.grid_data,
            palette: project.palette,
            grid_width: project.width,
            grid_height: project.height,
            content: {
                type: 'internal_pdf',
                metadata: {
                    yarnParts: metadata.yarnParts
                }
            }
        })
        .select()
        .single();

    if (insertError) {
        console.error('Publish Error:', insertError);
        return { error: insertError.message };
    }

    // Award credits for uploading a pattern
    try {
        const { addCredits } = await import('./credits');
        await addCredits(user.id, 100, 'Pattern Upload Reward');
    } catch (creditError) {
        console.error('Failed to award credits:', creditError);
    }

    revalidatePath('/marketplace');
    return { success: true, patternId: pattern.id };
}

