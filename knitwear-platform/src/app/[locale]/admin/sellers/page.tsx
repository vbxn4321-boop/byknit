import React from 'react';
import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';
import { Users, Store, ExternalLink } from 'lucide-react';

export default async function AdminSellersPage({
    params
}: {
    params: Promise<{ locale: string }>
}) {
    const { locale } = await params;
    const supabase = await createClient();

    // 입점 승인(seller_status = 'approved')된 판매자만 표시
    const { data: profiles } = await supabase
        .from('profiles')
        .select(`
            id,
            display_name,
            avatar_url,
            created_at
        `)
        .eq('seller_status', 'approved')
        .order('created_at', { ascending: false });

    const sellerIds = (profiles || []).map(p => p.id);
    const { data: patterns } = sellerIds.length > 0
        ? await supabase.from('patterns').select('designer_id').in('designer_id', sellerIds)
        : { data: [] as { designer_id: string }[] };

    const sellers = (profiles || []).map(p => ({
        ...p,
        productCount: (patterns || []).filter(pat => pat.designer_id === p.id).length
    }));

    return (
        <div className="p-6 md:p-10 font-sans text-stone-700 max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-stone-900 flex items-center gap-2">
                        <Store size={24} className="text-rose-600" />
                        통합 판매자 관리
                    </h1>
                    <p className="text-sm text-stone-400 font-bold mt-1">플랫폼에 등록된 판매자(디자이너) 목록과 상세 대시보드를 관리합니다.</p>
                </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center">
                    <Users size={20} />
                </div>
                <div>
                    <span className="text-xs font-bold text-stone-400">활성 판매자 수</span>
                    <div className="text-2xl font-black text-stone-800 mt-1">{sellers.length}명</div>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-bold">
                            <tr>
                                <th className="px-6 py-4">판매자 (스토어)</th>
                                <th className="px-6 py-4 text-center">등록 상품 수</th>
                                <th className="px-6 py-4">가입일</th>
                                <th className="px-6 py-4 text-center">관리 액션</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100">
                            {sellers.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-stone-400 font-bold">
                                        등록된 판매자가 없습니다.
                                    </td>
                                </tr>
                            ) : (
                                sellers.map(seller => (
                                    <tr key={seller.id} className="hover:bg-stone-50 transition-colors">
                                        <td className="px-6 py-4 font-bold text-stone-800">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-peach-100 flex items-center justify-center overflow-hidden shrink-0">
                                                    {seller.avatar_url ? (
                                                        <img src={seller.avatar_url} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span className="text-peach-500 font-bold">{seller.display_name?.[0] || '?'}</span>
                                                    )}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="truncate max-w-[200px]">{seller.display_name || '이름 없음'}</span>
                                                    <span className="text-[10px] text-stone-400 font-mono">{seller.id}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center font-bold text-emerald-600">
                                            {seller.productCount}개
                                        </td>
                                        <td className="px-6 py-4 text-stone-500 text-xs">
                                            {new Date(seller.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center gap-2">
                                                <Link 
                                                    href={`/${locale}/admin/sellers/${seller.id}/dashboard`}
                                                    className="px-4 py-2 bg-stone-900 text-white rounded-xl text-xs font-bold hover:bg-stone-800 transition-colors flex items-center gap-1.5 shadow-soft"
                                                >
                                                    <ExternalLink size={14} />
                                                    대시보드 보기
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
