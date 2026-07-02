'use client';

import { useState, useEffect } from 'react';
import { voteInPoll, getPollDetails } from '@/app/actions/poll';
import { Loader2, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { User } from '@supabase/supabase-js';

interface PollOption {
    id: string;
    text: string;
    votesCount: number;
    percentage: number;
}

interface PollState {
    pollId: string;
    question: string;
    totalVotes: number;
    userVotedOptionId: string | null;
    options: PollOption[];
}

interface PollRendererProps {
    postId: string;
    locale: string;
    user: User | null;
}

export function PollRenderer({ postId, locale, user }: PollRendererProps) {
    const router = useRouter();
    const [poll, setPoll] = useState<PollState | null>(null);
    const [loading, setLoading] = useState(true);
    const [votingId, setVotingId] = useState<string | null>(null);

    const loadPoll = async () => {
        try {
            const data = await getPollDetails(postId);
            setPoll(data);
        } catch (err) {
            console.error('Failed to load poll:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPoll();
    }, [postId]);

    const handleVote = async (optionId: string) => {
        if (!user) {
            router.push(`/${locale}/login`);
            return;
        }

        setVotingId(optionId);
        try {
            if (poll) {
                await voteInPoll(poll.pollId, optionId);
                await loadPoll();
            }
        } catch (err) {
            console.error('Error voting:', err);
            alert(locale === 'ko' ? '투표 처리에 실패했습니다.' : 'Failed to cast vote.');
        } finally {
            setVotingId(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8 bg-white rounded-3xl border border-tan-100 shadow-soft">
                <Loader2 className="w-6 h-6 animate-spin text-rose-400" />
            </div>
        );
    }

    if (!poll) {
        return null;
    }

    const hasVoted = poll.userVotedOptionId !== null;

    return (
        <div className="bg-white rounded-3xl border border-tan-100 shadow-soft-md p-6 my-6 max-w-xl mx-auto overflow-hidden relative">
            {/* Hinge Line Decor */}
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-peach-300 via-rose-400 to-peach-400"></div>

            {/* Poll Question */}
            <h4 className="font-bold text-brown-800 text-lg mb-2 mt-1 leading-snug">
                {poll.question}
            </h4>
            
            {/* Total Votes */}
            <p className="text-xs text-brown-400 mb-6 font-medium">
                {locale === 'ko' ? `총 ${poll.totalVotes}명 참여` : `${poll.totalVotes} votes`}
                {hasVoted && (
                    <span className="ml-2 text-rose-500 font-bold">
                        {locale === 'ko' ? '• 투표 완료' : '• Voted'}
                    </span>
                )}
            </p>

            {/* Options */}
            <div className="space-y-3">
                {poll.options.map((option) => {
                    const isSelected = poll.userVotedOptionId === option.id;
                    const showResults = hasVoted; // Always show results if current user voted

                    return (
                        <button
                            key={option.id}
                            disabled={votingId !== null}
                            onClick={() => handleVote(option.id)}
                            className="w-full relative overflow-hidden rounded-2xl border text-left transition-all duration-300 h-12 flex items-center justify-between px-4 group disabled:opacity-70"
                            style={{
                                borderColor: isSelected ? 'var(--color-rose-300, #fda4af)' : 'var(--color-tan-100, #f3e8d2)'
                            }}
                        >
                            {/* Animated Background Progress Bar */}
                            {showResults && (
                                <div
                                    className={`absolute left-0 top-0 h-full transition-all duration-500 ease-out z-0 ${
                                        isSelected 
                                            ? 'bg-rose-50/70 border-r border-rose-100/50' 
                                            : 'bg-cream-50/50'
                                    }`}
                                    style={{ width: `${option.percentage}%` }}
                                ></div>
                            )}

                            {/* Option Content */}
                            <div className="flex items-center gap-2.5 z-10 font-bold text-sm text-brown-700">
                                {showResults && isSelected && (
                                    <Check className="w-4 h-4 text-rose-500 stroke-[3]" />
                                )}
                                <span className={isSelected ? 'text-rose-600 font-extrabold' : 'group-hover:text-rose-500 transition-colors'}>
                                    {option.text}
                                </span>
                            </div>

                            {/* Percentage / Count */}
                            {showResults && (
                                <div className="text-xs font-bold text-brown-500 z-10 flex items-center gap-1.5">
                                    <span className={isSelected ? 'text-rose-600' : ''}>
                                        {option.percentage}%
                                    </span>
                                    <span className="text-[10px] text-brown-300 font-normal">
                                        ({option.votesCount}명)
                                    </span>
                                </div>
                            )}

                            {/* Small loading spinner inside option being clicked */}
                            {votingId === option.id && (
                                <Loader2 className="w-4 h-4 animate-spin text-rose-500 z-10" />
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Helper Hint */}
            {hasVoted && (
                <p className="text-[10px] text-brown-400 mt-4 text-center">
                    {locale === 'ko' 
                        ? '✔️ 이미 투표한 항목을 다시 누르면 투표가 철회됩니다.' 
                        : '✔️ Click your voted choice again to retract your vote.'}
                </p>
            )}
        </div>
    );
}
