'use server'

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function voteInPoll(pollId: string, optionId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error('Unauthorized');
    }

    // 1. Check if user already voted in this poll
    const { data: existingVote, error: fetchError } = await supabase
        .from('poll_votes')
        .select('*')
        .eq('poll_id', pollId)
        .eq('user_id', user.id)
        .maybeSingle();

    if (fetchError) {
        console.error('Error fetching existing vote:', fetchError);
        throw new Error('Database error');
    }

    if (existingVote) {
        if (existingVote.option_id === optionId) {
            // Clicked the same option -> retract the vote (toggle off)
            const { error: deleteError } = await supabase
                .from('poll_votes')
                .delete()
                .eq('id', existingVote.id);
                
            if (deleteError) throw new Error(deleteError.message);
        } else {
            // Clicked a different option -> update the vote (change choice)
            const { error: updateError } = await supabase
                .from('poll_votes')
                .update({ option_id: optionId })
                .eq('id', existingVote.id);
                
            if (updateError) throw new Error(updateError.message);
        }
    } else {
        // Cast a new vote
        const { error: insertError } = await supabase
            .from('poll_votes')
            .insert({
                poll_id: pollId,
                option_id: optionId,
                user_id: user.id
            });
            
        if (insertError) throw new Error(insertError.message);
    }

    // Revalidate paths to refresh cache
    revalidatePath('/community');
    revalidatePath('/[locale]/community', 'page');
    return { success: true };
}

export async function getPollDetails(postId: string) {
    const supabase = await createClient();
    
    // 1. Fetch poll linked to the post
    const { data: poll, error: pollError } = await supabase
        .from('polls')
        .select('*')
        .eq('post_id', postId)
        .maybeSingle();
        
    if (pollError || !poll) {
        return null;
    }
    
    // 2. Fetch options
    const { data: options, error: optionsError } = await supabase
        .from('poll_options')
        .select('*')
        .eq('poll_id', poll.id);
        
    if (optionsError || !options) {
        return null;
    }
    
    // 3. Fetch votes count
    const { data: votes, error: votesError } = await supabase
        .from('poll_votes')
        .select('option_id, user_id')
        .eq('poll_id', poll.id);
        
    if (votesError || !votes) {
        return null;
    }
    
    const { data: { user } } = await supabase.auth.getUser();
    
    // Aggregate results
    const totalVotes = votes.length;
    const userVotedOptionId = user 
        ? votes.find(v => v.user_id === user.id)?.option_id || null
        : null;
        
    const optionsWithStats = options.map(opt => {
        const optVotes = votes.filter(v => v.option_id === opt.id).length;
        const percentage = totalVotes > 0 ? Math.round((optVotes / totalVotes) * 100) : 0;
        
        return {
            id: opt.id,
            text: opt.option_text,
            votesCount: optVotes,
            percentage
        };
    });
    
    return {
        pollId: poll.id,
        question: poll.question,
        totalVotes,
        userVotedOptionId,
        options: optionsWithStats
    };
}
