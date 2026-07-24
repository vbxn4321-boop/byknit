'use client';

import React, { useState } from 'react';
import { 
    Plus, 
    Search, 
    Filter, 
    Edit, 
    EyeOff, 
    Eye, 
    Trash2, 
    X,
    Package,
    Layers,
    DollarSign,
    Check
} from 'lucide-react';

interface PhysicalProduct {
    id: number;
    name: string;
    category: string;
    price: number;
    discountPrice?: number;
    status: 'selling' | 'hidden' | 'soldout';
    options: { name: string; stock: number }[];
    imageUrl: string;
}

export function ProductManagement({ locale }: { locale: string }) {
    // Mock initial physical products
    const [products, setProducts] = useState<PhysicalProduct[]>([
        { 
            id: 1, 
            name: '파스텔 소프트 코튼 털실 (50g)', 
            category: 'yarn', 
            price: 4500, 
            discountPrice: 3800, 
            status: 'selling',
            options: [
                { name: '밀크화이트 / 얇음', stock: 120 },
                { name: '베이비블루 / 얇음', stock: 45 },
                { name: '소프트베이지 / 보통', stock: 80 }
            ],
            imageUrl: 'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?q=80&w=200&auto=format&fit=crop'
        },
        { 
            id: 2, 
            name: '유기농 내추럴 메리노 울', 
            category: 'yarn', 
            price: 8900, 
            status: 'selling',
            options: [
                { name: '오트밀 베이지 / 보통', stock: 15 },
                { name: '차콜 그레이 / 굵음', stock: 0 },
                { name: '소프트 세이지 / 보통', stock: 35 }
            ],
            imageUrl: 'https://images.unsplash.com/photo-1584992236310-6edddc085ff8?q=80&w=200&auto=format&fit=crop'
        },
        { 
            id: 3, 
            name: '카본 대바늘 35cm 5종 풀패키지', 
            category: 'needle', 
            price: 24000, 
            discountPrice: 21500, 
            status: 'soldout',
            options: [
                { name: '3mm ~ 5mm 패키지', stock: 0 }
            ],
            imageUrl: 'https://images.unsplash.com/photo-1595079676339-1534801ad6cf?q=80&w=200&auto=format&fit=crop'
        },
        { 
            id: 4, 
            name: '비건 레더 가죽 라벨 (10개입)', 
            category: 'notions', 
            price: 3500, 
            status: 'hidden',
            options: [
                { name: '브라운 레더', stock: 30 },
                { name: '클래식 블랙', stock: 10 }
            ],
            imageUrl: 'https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=200&auto=format&fit=crop'
        }
    ]);

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    // Form states for new product
    const [newName, setNewName] = useState('');
    const [newCategory, setNewCategory] = useState('yarn');
    const [newPrice, setNewPrice] = useState('');
    const [newDiscountPrice, setNewDiscountPrice] = useState('');
    const [newImage, setNewImage] = useState('');
    const [newOptions, setNewOptions] = useState<{ name: string; stock: number }[]>([
        { name: '기본 옵션', stock: 50 }
    ]);

    const handleAddOption = () => {
        setNewOptions([...newOptions, { name: '', stock: 10 }]);
    };

    const handleRemoveOption = (index: number) => {
        setNewOptions(newOptions.filter((_, i) => i !== index));
    };

    const handleOptionChange = (index: number, field: 'name' | 'stock', value: string | number) => {
        const updated = [...newOptions];
        if (field === 'name') {
            updated[index].name = value as string;
        } else {
            updated[index].stock = Number(value);
        }
        setNewOptions(updated);
    };

    const handleSaveProduct = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName || !newPrice) return;

        const newProduct: PhysicalProduct = {
            id: Date.now(),
            name: newName,
            category: newCategory,
            price: Number(newPrice),
            discountPrice: newDiscountPrice ? Number(newDiscountPrice) : undefined,
            status: 'selling',
            options: newOptions.filter(opt => opt.name.trim() !== ''),
            imageUrl: newImage.trim() || 'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?q=80&w=200&auto=format&fit=crop'
        };

        setProducts([newProduct, ...products]);
        setIsAddModalOpen(false);
        resetForm();
    };

    const resetForm = () => {
        setNewName('');
        setNewCategory('yarn');
        setNewPrice('');
        setNewDiscountPrice('');
        setNewImage('');
        setNewOptions([{ name: '기본 옵션', stock: 50 }]);
    };

    const toggleStatus = (id: number) => {
        setProducts(products.map(p => {
            if (p.id === id) {
                const nextStatusMap: Record<string, 'selling' | 'hidden' | 'soldout'> = {
                    selling: 'hidden',
                    hidden: 'soldout',
                    soldout: 'selling'
                };
                return { ...p, status: nextStatusMap[p.status] };
            }
            return p;
        }));
    };

    const deleteProduct = (id: number) => {
        if (confirm(locale === 'ko' ? '정말로 이 상품을 삭제하시겠습니까?' : 'Are you sure you want to delete this product?')) {
            setProducts(products.filter(p => p.id !== id));
        }
    };

    const filteredProducts = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const categoryLabels: Record<string, string> = {
        yarn: locale === 'ko' ? '털실' : 'Yarn',
        needle: locale === 'ko' ? '바늘' : 'Needles',
        notions: locale === 'ko' ? '부자재' : 'Notions',
        etc: locale === 'ko' ? '기타' : 'Etc.'
    };

    const statusBadges = {
        selling: { text: locale === 'ko' ? '판매 중' : 'Selling', color: 'bg-emerald-50 text-emerald-600 border border-emerald-100' },
        hidden: { text: locale === 'ko' ? '숨김' : 'Hidden', color: 'bg-stone-50 text-stone-400 border border-stone-100' },
        soldout: { text: locale === 'ko' ? '품절' : 'Sold Out', color: 'bg-rose-50 text-rose-500 border border-rose-100' }
    };

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-stone-800 font-sans">
                        {locale === 'ko' ? '상품 관리' : 'Product Management'}
                    </h1>
                    <p className="text-stone-500 text-sm mt-1">
                        {locale === 'ko' ? '실물 배송 상품의 옵션 정보 및 재고 상황을 실시간 관리합니다.' : 'Manage option info and inventory of physical goods.'}
                    </p>
                </div>
                <button 
                    onClick={() => setIsAddModalOpen(true)}
                    className="btn-rose rounded-2xl px-6 py-3.5 font-bold shadow-soft flex items-center justify-center gap-2 hover:-translate-y-0.5 transition-transform"
                >
                    <Plus size={18} />
                    <span>{locale === 'ko' ? '신규 상품 등록' : 'Register Product'}</span>
                </button>
            </div>

            {/* Filter and Search Bar */}
            <div className="bg-white p-4 rounded-3xl border border-stone-100 shadow-soft flex flex-col md:flex-row items-center gap-4">
                {/* Search */}
                <div className="relative w-full md:flex-1">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
                    <input 
                        type="text" 
                        placeholder={locale === 'ko' ? '상품명으로 검색...' : 'Search by product name...'}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-stone-50 border-0 rounded-2xl text-sm focus:bg-stone-100/50 outline-none text-stone-700 transition-colors"
                    />
                </div>
                {/* Filters */}
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="flex bg-stone-50 p-1.5 rounded-2xl border border-stone-100 w-full md:w-auto overflow-x-auto">
                        {['all', 'yarn', 'needle', 'notions'].map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`
                                    px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all
                                    ${selectedCategory === cat 
                                        ? 'bg-white text-stone-800 shadow-soft' 
                                        : 'text-stone-400 hover:text-stone-700'}
                                `}
                            >
                                {cat === 'all' ? (locale === 'ko' ? '전체' : 'All') : categoryLabels[cat]}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Products Table Card */}
            <div className="bg-white rounded-3xl border border-stone-100 shadow-soft overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left">
                        <thead>
                            <tr className="bg-stone-50/70 border-b border-stone-100 text-stone-400 text-xs font-bold">
                                <th className="p-5">{locale === 'ko' ? '상품 정보' : 'Product Info'}</th>
                                <th className="p-5">{locale === 'ko' ? '카테고리' : 'Category'}</th>
                                <th className="p-5">{locale === 'ko' ? '판매가' : 'Price'}</th>
                                <th className="p-5">{locale === 'ko' ? '옵션 및 재고수량' : 'Options & Inventory'}</th>
                                <th className="p-5">{locale === 'ko' ? '상태 (전환)' : 'Status (Toggle)'}</th>
                                <th className="p-5 text-right">{locale === 'ko' ? '관리' : 'Actions'}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100">
                            {filteredProducts.length > 0 ? (
                                filteredProducts.map((p) => {
                                    const badge = statusBadges[p.status];
                                    const totalStock = p.options.reduce((acc, opt) => acc + opt.stock, 0);

                                    return (
                                        <tr key={p.id} className="hover:bg-stone-50/30 transition-colors text-stone-700 text-sm">
                                            {/* Info */}
                                            <td className="p-5">
                                                <div className="flex items-center gap-4">
                                                    <img 
                                                        src={p.imageUrl} 
                                                        alt={p.name} 
                                                        className="w-14 h-14 rounded-2xl object-cover bg-stone-100 shadow-soft"
                                                    />
                                                    <div>
                                                        <h3 className="font-bold text-stone-800 line-clamp-1 leading-tight">{p.name}</h3>
                                                        <span className="text-[10px] text-stone-400 font-semibold block mt-1">ID: #{p.id}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            {/* Category */}
                                            <td className="p-5 font-semibold text-stone-500">
                                                {categoryLabels[p.category]}
                                            </td>
                                            {/* Price */}
                                            <td className="p-5 font-bold">
                                                {p.discountPrice ? (
                                                    <div className="space-y-0.5">
                                                        <div className="text-[#E25858]">₩{p.discountPrice.toLocaleString()}</div>
                                                        <div className="text-xs text-stone-400 line-through font-medium">₩{p.price.toLocaleString()}</div>
                                                    </div>
                                                ) : (
                                                    <span>₩{p.price.toLocaleString()}</span>
                                                )}
                                            </td>
                                            {/* Options & Stock */}
                                            <td className="p-5">
                                                <div className="space-y-1 max-w-[240px]">
                                                    <div className="text-xs font-bold text-stone-800 mb-1">
                                                        {locale === 'ko' ? `총 재고: ${totalStock}개` : `Total Stock: ${totalStock}ea`}
                                                    </div>
                                                    {p.options.map((opt, i) => (
                                                        <div key={i} className="flex justify-between items-center text-xs text-stone-400 bg-stone-50 px-2 py-0.5 rounded-lg border border-stone-100/50">
                                                            <span className="truncate max-w-[130px]">{opt.name}</span>
                                                            <span className={`font-bold ml-2 ${opt.stock === 0 ? 'text-rose-500' : 'text-stone-600'}`}>
                                                                {opt.stock}개
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </td>
                                            {/* Status Badge */}
                                            <td className="p-5">
                                                <button 
                                                    onClick={() => toggleStatus(p.id)}
                                                    className={`px-3 py-1.5 rounded-full text-xs font-bold ${badge.color} hover:scale-105 active:scale-95 transition-transform`}
                                                    title={locale === 'ko' ? '클릭 시 상태 전환' : 'Click to toggle status'}
                                                >
                                                    {badge.text}
                                                </button>
                                            </td>
                                            {/* Actions */}
                                            <td className="p-5 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button 
                                                        onClick={() => deleteProduct(p.id)}
                                                        className="p-2 text-stone-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={6} className="p-16 text-center text-stone-400 font-medium">
                                        <Package className="w-10 h-10 mx-auto text-stone-200 mb-3" />
                                        {locale === 'ko' ? '등록된 상품이 없습니다.' : 'No products found.'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Product Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-stone-100 overflow-hidden animate-zoomIn max-h-[90vh] flex flex-col">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
                            <h2 className="text-xl font-bold text-stone-800 font-sans flex items-center gap-2">
                                <Package size={20} className="text-[#8FBC8F]" />
                                <span>{locale === 'ko' ? '신규 실물 상품 등록' : 'Add New Product'}</span>
                            </h2>
                            <button 
                                onClick={() => setIsAddModalOpen(false)}
                                className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-xl transition-all"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Modal Form Content */}
                        <form onSubmit={handleSaveProduct} className="flex-1 overflow-y-auto p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Product Name */}
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-xs font-bold text-stone-500 block">{locale === 'ko' ? '상품명 *' : 'Product Name *'}</label>
                                    <input 
                                        type="text" 
                                        required
                                        placeholder={locale === 'ko' ? '예: 프렌치 메리노울 연베이지' : 'e.g. French Merino Wool Oatmeal'}
                                        value={newName}
                                        onChange={(e) => setNewName(e.target.value)}
                                        className="w-full px-4 py-3 bg-stone-50 border border-stone-100 rounded-2xl text-sm outline-none focus:bg-stone-100/50 transition-colors text-stone-700"
                                    />
                                </div>

                                {/* Category */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-stone-500 block">{locale === 'ko' ? '카테고리' : 'Category'}</label>
                                    <select 
                                        value={newCategory}
                                        onChange={(e) => setNewCategory(e.target.value)}
                                        className="w-full px-4 py-3 bg-stone-50 border border-stone-100 rounded-2xl text-sm outline-none text-stone-700 font-bold"
                                    >
                                        <option value="yarn">{locale === 'ko' ? '털실 (Yarn)' : 'Yarn'}</option>
                                        <option value="needle">{locale === 'ko' ? '바늘 (Needles)' : 'Needles'}</option>
                                        <option value="notions">{locale === 'ko' ? '부자재 (Notions)' : 'Notions'}</option>
                                        <option value="etc">{locale === 'ko' ? '기타 (Etc)' : 'Etc'}</option>
                                    </select>
                                </div>

                                {/* Image URL Mock */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-stone-500 block">{locale === 'ko' ? '상품 썸네일 이미지 URL' : 'Image URL'}</label>
                                    <input 
                                        type="url" 
                                        placeholder="https://images.unsplash.com/..."
                                        value={newImage}
                                        onChange={(e) => setNewImage(e.target.value)}
                                        className="w-full px-4 py-3 bg-stone-50 border border-stone-100 rounded-2xl text-sm outline-none focus:bg-stone-100/50 transition-colors text-stone-700"
                                    />
                                </div>

                                {/* Original Price */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-stone-500 block">{locale === 'ko' ? '원래 판매가 (원) *' : 'Original Price *'}</label>
                                    <input 
                                        type="number" 
                                        required
                                        placeholder="₩"
                                        value={newPrice}
                                        onChange={(e) => setNewPrice(e.target.value)}
                                        className="w-full px-4 py-3 bg-stone-50 border border-stone-100 rounded-2xl text-sm outline-none focus:bg-stone-100/50 transition-colors text-stone-700"
                                    />
                                </div>

                                {/* Discount Price */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-stone-500 block">{locale === 'ko' ? '특별 할인가 (선택)' : 'Discount Price (Optional)'}</label>
                                    <input 
                                        type="number" 
                                        placeholder="₩"
                                        value={newDiscountPrice}
                                        onChange={(e) => setNewDiscountPrice(e.target.value)}
                                        className="w-full px-4 py-3 bg-stone-50 border border-stone-100 rounded-2xl text-sm outline-none focus:bg-stone-100/50 transition-colors text-stone-700"
                                    />
                                </div>
                            </div>

                            {/* Options and Stock Config */}
                            <div className="space-y-3 pt-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold text-stone-500 flex items-center gap-1">
                                        <Layers size={14} className="text-[#8FBC8F]" />
                                        <span>{locale === 'ko' ? '옵션 및 개별 재고 설정 *' : 'Options & Inventory *'}</span>
                                    </label>
                                    <button 
                                        type="button"
                                        onClick={handleAddOption}
                                        className="text-xs font-bold text-[#556B2F] bg-[#E8F0E8] px-2.5 py-1.5 rounded-xl hover:bg-[#8FBC8F] hover:text-white transition-all flex items-center gap-1"
                                    >
                                        <Plus size={12} />
                                        <span>{locale === 'ko' ? '옵션 추가' : 'Add Option'}</span>
                                    </button>
                                </div>

                                <div className="space-y-2 max-h-[160px] overflow-y-auto border border-stone-100 p-3 rounded-2xl bg-stone-50/50">
                                    {newOptions.map((opt, i) => (
                                        <div key={i} className="flex items-center gap-3 animate-fadeIn">
                                            <input 
                                                type="text" 
                                                required
                                                placeholder={locale === 'ko' ? '옵션명 (예: 아이보리 / 얇음)' : 'Option name (e.g. Ivory / Thin)'}
                                                value={opt.name}
                                                onChange={(e) => handleOptionChange(i, 'name', e.target.value)}
                                                className="flex-1 px-3 py-2 bg-white border border-stone-100 rounded-xl text-xs outline-none text-stone-700"
                                            />
                                            <div className="flex items-center gap-2">
                                                <input 
                                                    type="number" 
                                                    required
                                                    min="0"
                                                    placeholder="재고"
                                                    value={opt.stock}
                                                    onChange={(e) => handleOptionChange(i, 'stock', e.target.value)}
                                                    className="w-20 px-3 py-2 bg-white border border-stone-100 rounded-xl text-xs outline-none text-stone-700 text-center font-bold"
                                                />
                                                <span className="text-xs font-bold text-stone-400">{locale === 'ko' ? '개' : 'ea'}</span>
                                            </div>
                                            {newOptions.length > 1 && (
                                                <button 
                                                    type="button"
                                                    onClick={() => handleRemoveOption(i)}
                                                    className="p-2 text-stone-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 transition-colors"
                                                >
                                                    <X size={14} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Submit Button */}
                            <div className="pt-4 border-t border-stone-100 flex items-center justify-end gap-3 bg-stone-50/20 -mx-6 -mb-6 p-6">
                                <button 
                                    type="button"
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="px-5 py-3 bg-stone-100 hover:bg-stone-200 text-stone-600 font-bold rounded-2xl text-sm transition-all"
                                >
                                    {locale === 'ko' ? '취소' : 'Cancel'}
                                </button>
                                <button 
                                    type="submit"
                                    className="px-6 py-3 bg-stone-800 hover:bg-stone-900 text-white font-bold rounded-2xl text-sm transition-all shadow-md flex items-center gap-1.5"
                                >
                                    <Check size={16} />
                                    <span>{locale === 'ko' ? '상품 등록 완료' : 'Save Product'}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
