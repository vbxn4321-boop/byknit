'use client';

import React, { useState, useRef } from 'react';
import { 
    Search, 
    Download, 
    Upload,
    Check, 
    AlertTriangle,
    Calendar,
    User,
    MapPin,
    MessageSquare,
    Info,
    Edit2
} from 'lucide-react';

interface Order {
    id: string;
    orderTime: string;          // 초 단위 결제 일시
    expectedShipDate: string;   // 출고예정일
    customerName: string;
    contact: string;            // 안심번호
    address: string;            // 배송지 주소
    shippingMessage: string;    // 배송 메시지
    productName: string;
    optionSelected: string;
    quantity: number;
    price: number;
    shippingFee: number;
    splitShipping: 'Y' | 'N';
    status: 'new' | 'preparing' | 'shipping' | 'completed';
    carrier: string;            // 택배사
    trackingNumber: string;     // 운송장번호
}

export function OrderManagement({ locale }: { locale: string }) {
    // Initial mock orders (Coupang Wing matching data)
    const [orders, setOrders] = useState<Order[]>([
        { 
            id: '6101588833390', 
            orderTime: '2026-07-24 13:05:22',
            expectedShipDate: '2026.08.11',
            customerName: '오기남', 
            contact: '0504-4987-7428',
            address: '제주특별자치도 제주시 첨단로 242 한라아파트 104호',
            shippingMessage: '문 앞에 놓아주세요. 벨은 누르지 말아주세요.',
            productName: '흠집 매트, 그레이 20개 2cm', 
            optionSelected: '색상: 그레이, 사이즈: 2cm, 수량: 20', 
            quantity: 1, 
            price: 49000, 
            shippingFee: 3000, 
            splitShipping: 'N',
            status: 'preparing',
            carrier: '',
            trackingNumber: ''
        },
        { 
            id: '15101609070459', 
            orderTime: '2026-07-24 11:20:05',
            expectedShipDate: '2026.08.12',
            customerName: '최경호', 
            contact: '0502-1584-5759',
            address: '부산광역시 해운대구 우동 1405 센텀빌라 4층 402호',
            shippingMessage: '배송 전 연락 부탁드립니다.',
            productName: '흠집 매트, 블랙 20개 2cm', 
            optionSelected: '색상: 블랙, 사이즈: 2cm, 수량: 20', 
            quantity: 1, 
            price: 49000, 
            shippingFee: 0, 
            splitShipping: 'N',
            status: 'preparing',
            carrier: '',
            trackingNumber: ''
        },
        { 
            id: '11101611587928', 
            orderTime: '2026-07-24 09:30:11',
            expectedShipDate: '2026.08.12',
            customerName: '신지숙', 
            contact: '0502-4455-6145',
            address: '충청북도 청주시 흥덕구 가경동 78-6 2층',
            shippingMessage: '부재 시 경비실에 맡겨주세요.',
            productName: '무늬오징어 에기, 3.5호 10종 세트', 
            optionSelected: '수량: 1, 색상: 3.5호 10종 세트', 
            quantity: 1, 
            price: 28500, 
            shippingFee: 3000, 
            splitShipping: 'N',
            status: 'preparing',
            carrier: '',
            trackingNumber: ''
        },
        { 
            id: '21101613251154', 
            orderTime: '2026-07-23 16:42:00',
            expectedShipDate: '2026.08.12',
            customerName: '이오섭', 
            contact: '0502-5315-4597',
            address: '경기도 수원시 영통구 매탄동 1024 매탄아파트 704동 302호',
            shippingMessage: '택배함에 넣어주세요.',
            productName: '흠집 매트, 아이보리 20개 1.2cm', 
            optionSelected: '색상: 아이보리, 사이즈: 1.2cm, 수량: 20', 
            quantity: 1, 
            price: 39000, 
            shippingFee: 0, 
            splitShipping: 'N',
            status: 'preparing',
            carrier: '',
            trackingNumber: ''
        },
        { 
            id: '9101638152551', 
            orderTime: '2026-07-23 10:11:54',
            expectedShipDate: '2026.08.13',
            customerName: '배동훈', 
            contact: '0502-5000-9139',
            address: '부산광역시 금정구 장전동 29-3 원룸 201호',
            shippingMessage: '문 앞에 두고 가볍게 노크해주세요.',
            productName: '무늬오징어 에기, 3.5호 10종 세트', 
            optionSelected: '수량: 1, 색상: 3.5호 10종 세트', 
            quantity: 1, 
            price: 28500, 
            shippingFee: 3000, 
            splitShipping: 'N',
            status: 'preparing',
            carrier: '',
            trackingNumber: ''
        },
        { 
            id: '3101567119280', 
            orderTime: '2026-07-24 13:40:00',
            expectedShipDate: '2026.07.24',  // 당일 출고 필요
            customerName: '한나경', 
            contact: '0504-1234-9876',
            address: '서울특별시 마포구 아현동 302 래미안 102동 405호',
            shippingMessage: '빠른 배송 부탁드립니다!',
            productName: '파스텔 소프트 코튼 털실 (50g)', 
            optionSelected: '색상: 밀크화이트', 
            quantity: 3, 
            price: 13500, 
            shippingFee: 3000, 
            splitShipping: 'N',
            status: 'new',
            carrier: '',
            trackingNumber: ''
        }
    ]);

    // Active status filter (Coupang Wing header style)
    const [activePriorityFilter, setActivePriorityFilter] = useState<'all' | 'delayed' | 'today'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
    
    // CSV Validation States
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
    const fileInputRef = useRef<HTMLInputElement>(null);

    // List of allowed carriers
    const allowedCarriers = ['CJ대한통운', '우체국택배', '한진택배', '롯데택배', '로젠택배'];

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedOrderIds(filteredOrders.map(o => o.id));
        } else {
            setSelectedOrderIds([]);
        }
    };

    const handleSelectOrder = (id: string, checked: boolean) => {
        if (checked) {
            setSelectedOrderIds([...selectedOrderIds, id]);
        } else {
            setSelectedOrderIds(selectedOrderIds.filter(item => item !== id));
        }
    };

    // Inline field modifications
    const handleFieldChange = (orderId: string, field: 'carrier' | 'trackingNumber', value: string) => {
        setOrders(orders.map(o => {
            if (o.id === orderId) {
                return { ...o, [field]: value };
            }
            return o;
        }));

        // Clean validation errors on input change
        if (validationErrors[orderId]) {
            const updated = { ...validationErrors };
            delete updated[orderId];
            setValidationErrors(updated);
        }
    };

    // Bulk Ship Action (선택 건 발송 처리)
    const handleBulkShip = () => {
        if (selectedOrderIds.length === 0) {
            alert(locale === 'ko' ? '발송 처리할 주문을 선택해 주세요.' : 'Please select orders to ship.');
            return;
        }

        const errors: Record<string, string> = {};
        const updatedOrders = orders.map(o => {
            if (selectedOrderIds.includes(o.id)) {
                if (!o.carrier) {
                    errors[o.id] = locale === 'ko' ? '택배사가 선택되지 않았습니다.' : 'Carrier not selected.';
                } else if (!o.trackingNumber || !/^\d+$/.test(o.trackingNumber)) {
                    errors[o.id] = locale === 'ko' ? '올바른 운송장 번호(숫자)를 입력하세요.' : 'Invalid tracking number.';
                }

                if (!errors[o.id]) {
                    return { ...o, status: 'shipping' as const };
                }
            }
            return o;
        });

        if (Object.keys(errors).length > 0) {
            setValidationErrors(errors);
            alert(locale === 'ko' 
                ? `선택하신 건 중 ${Object.keys(errors).length}건에 오류가 있습니다. 빨간색 강조 표시된 부분을 수정해 주세요.` 
                : `${Object.keys(errors).length} orders have validation errors. Please fix highlighted fields.`);
        } else {
            setOrders(updatedOrders);
            setSelectedOrderIds([]);
            setValidationErrors({});
            alert(locale === 'ko' ? '선택하신 주문의 발송 처리가 완료되었습니다.' : 'Shipment processed successfully.');
        }
    };

    // Bulk Order Confirm (발주 확인)
    const handleBulkConfirm = () => {
        if (selectedOrderIds.length === 0) {
            alert(locale === 'ko' ? '발주 확인할 주문을 선택해 주세요.' : 'Please select orders.');
            return;
        }

        setOrders(orders.map(o => {
            if (selectedOrderIds.includes(o.id) && o.status === 'new') {
                return { ...o, status: 'preparing' };
            }
            return o;
        }));
        setSelectedOrderIds([]);
        alert(locale === 'ko' ? '선택한 주문의 발주 확인이 완료되었습니다.' : 'Orders confirmed.');
    };

    // Export CSV Template (발주서 다운로드)
    const handleExportCSV = () => {
        const headers = '\ufeff주문번호,주문일시,출고예정일,주문자명,연락처,배송지주소,배송메시지,상품명,옵션,수량,택배사,운송장번호\n';
        const rows = filteredOrders.map(o => 
            `"${o.id}","${o.orderTime}","${o.expectedShipDate}","${o.customerName}","${o.contact}","${o.address}","${o.shippingMessage}","${o.productName}","${o.optionSelected}",${o.quantity},"${o.carrier}","${o.trackingNumber}"`
        ).join('\n');

        const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `byknit_payout_orders_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Bulk Upload Tracking Numbers via CSV (운송장 일괄 업로드)
    const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            if (!text) return;

            // Split into rows and trim
            const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
            if (lines.length <= 1) {
                alert(locale === 'ko' ? '업로드할 데이터가 비어 있습니다.' : 'Upload file is empty.');
                return;
            }

            const errors: Record<string, string> = {};
            const newOrders = [...orders];
            let successCount = 0;

            // Loop starting from index 1 (skipping header)
            for (let i = 1; i < lines.length; i++) {
                // simple split by comma considering quotes
                const row = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.replace(/^"|"$/g, '').trim());
                
                const orderId = row[0];
                const carrierName = row[10];
                const trackingNum = row[11];

                if (!orderId) continue;

                const orderIndex = newOrders.findIndex(o => o.id === orderId);
                if (orderIndex === -1) {
                    continue; // Skip if not found
                }

                const currentOrder = newOrders[orderIndex];

                // Validate Carrier & Tracking
                if (!carrierName || !allowedCarriers.includes(carrierName)) {
                    errors[orderId] = locale === 'ko' ? '지원하지 않는 택배사명입니다.' : 'Invalid carrier name.';
                } else if (!trackingNum || !/^\d+$/.test(trackingNum)) {
                    errors[orderId] = locale === 'ko' ? '송장번호는 숫자만 가능합니다.' : 'Tracking number must be digits.';
                } else {
                    // Update order details to shipping status
                    newOrders[orderIndex] = {
                        ...currentOrder,
                        status: 'shipping',
                        carrier: carrierName,
                        trackingNumber: trackingNum
                    };
                    successCount++;
                }
            }

            setOrders(newOrders);
            setValidationErrors(errors);

            if (Object.keys(errors).length > 0) {
                alert(locale === 'ko' 
                    ? `일괄 업로드 완료: ${successCount}건 성공 / ${Object.keys(errors).length}건 오류 발생. 빨간색 하이라이트 줄을 확인하세요.`
                    : `Upload finished: ${successCount} success / ${Object.keys(errors).length} failed. Check red highlighted rows.`);
            } else {
                alert(locale === 'ko' 
                    ? `총 ${successCount}건의 주문에 운송장 등록이 성공적으로 처리되었습니다!` 
                    : `Total ${successCount} orders successfully updated with tracking numbers!`);
            }
        };

        reader.readAsText(file, 'UTF-8');
        e.target.value = ''; // Reset file input
    };

    // Calculate dynamic priority badges count
    const totalCount = orders.length;
    // Delayed shipments: status is preparing and expected date has passed (simulated logic: expected date earlier than 2026.08.12)
    const delayedCount = orders.filter(o => o.status === 'preparing' && o.expectedShipDate === '2026.08.11').length;
    // Today ship required: expected ship date is today 2026.07.24
    const todayRequiredCount = orders.filter(o => o.status === 'new' && o.expectedShipDate === '2026.07.24').length;

    const filteredOrders = orders.filter(o => {
        // Search filter
        const matchesSearch = o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              o.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              o.id.toLowerCase().includes(searchQuery.toLowerCase());
        
        // Priority filter
        if (activePriorityFilter === 'delayed') {
            return matchesSearch && o.status === 'preparing' && o.expectedShipDate === '2026.08.11';
        }
        if (activePriorityFilter === 'today') {
            return matchesSearch && o.expectedShipDate === '2026.07.24';
        }
        return matchesSearch;
    });

    const isAllSelected = filteredOrders.length > 0 && selectedOrderIds.length === filteredOrders.length;

    return (
        <div className="space-y-6 animate-fadeIn text-stone-700">
            {/* Header Title */}
            <div>
                <h1 className="text-3xl font-black text-stone-800 font-sans">
                    {locale === 'ko' ? '배송 관리 (Coupang Wing)' : 'Shipping Management (Wing)'}
                </h1>
                <p className="text-stone-500 text-sm mt-1">
                    {locale === 'ko' 
                        ? '쿠팡 윙 스타일의 발주 배송 조회 테이블입니다. 체크박스 선택 후 일괄 발송 처리 및 엑셀 업로드를 지원합니다.' 
                        : 'Coupang Wing style order list grid. Supports bulk shipping status change and Excel CSV import/export.'}
                </p>
            </div>

            {/* Coupang Style Priority Filter Bars */}
            <div className="flex flex-wrap items-center gap-3 bg-white p-4 rounded-3xl border border-stone-100 shadow-soft">
                <span className="text-xs font-black text-stone-500 mr-2">{locale === 'ko' ? '배송 우선순위' : 'Shipping Priority'}</span>
                
                <button
                    onClick={() => setActivePriorityFilter('all')}
                    className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${
                        activePriorityFilter === 'all' 
                            ? 'bg-blue-600 border-blue-600 text-white shadow-soft' 
                            : 'bg-stone-50 border-stone-100 hover:bg-stone-100 text-stone-600'
                    }`}
                >
                    {locale === 'ko' ? `전체 ${totalCount}` : `All ${totalCount}`}
                </button>

                <button
                    onClick={() => setActivePriorityFilter('delayed')}
                    className={`px-4 py-2 rounded-full text-xs font-bold transition-all border flex items-center gap-1.5 ${
                        activePriorityFilter === 'delayed' 
                            ? 'bg-rose-500 border-rose-500 text-white shadow-soft' 
                            : 'bg-rose-50 border-rose-100 text-rose-600 hover:bg-rose-100'
                    }`}
                >
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-300 animate-pulse" />
                    {locale === 'ko' ? `출고지연 ${delayedCount}` : `Late Shipping ${delayedCount}`}
                </button>

                <button
                    onClick={() => setActivePriorityFilter('today')}
                    className={`px-4 py-2 rounded-full text-xs font-bold transition-all border flex items-center gap-1.5 ${
                        activePriorityFilter === 'today' 
                            ? 'bg-amber-500 border-amber-500 text-white shadow-soft' 
                            : 'bg-amber-50 border-amber-100 text-amber-600 hover:bg-amber-100'
                    }`}
                >
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                    {locale === 'ko' ? `당일출고 필요 ${todayRequiredCount}` : `Today Required ${todayRequiredCount}`}
                </button>
            </div>

            {/* Error Warning Banner (If any validation failed) */}
            {Object.keys(validationErrors).length > 0 && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-2xl flex items-center gap-3 animate-fadeIn">
                    <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
                    <div className="text-xs font-bold">
                        {locale === 'ko' 
                            ? `${Object.keys(validationErrors).length}건의 운송장 번호 오류가 있습니다. 아래 빨간색 테두리로 하이라이트된 행을 수정해 주세요.` 
                            : `${Object.keys(validationErrors).length} tracking number errors detected. Please fix the red highlighted rows.`}
                    </div>
                </div>
            )}

            {/* Bulk Action Toolbar */}
            <div className="bg-white p-4 rounded-3xl border border-stone-100 shadow-soft flex flex-col xl:flex-row items-center gap-4 justify-between">
                <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
                    <button
                        onClick={handleBulkConfirm}
                        className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-xl text-xs font-bold transition-all"
                    >
                        {locale === 'ko' ? '선택 발주확인' : 'Confirm Selected'}
                    </button>
                    
                    <button
                        onClick={handleBulkShip}
                        className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-soft"
                    >
                        <Check size={14} />
                        <span>{locale === 'ko' ? '선택 건 발송 처리' : 'Ship Selected'}</span>
                    </button>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto justify-end">
                    {/* Search Field */}
                    <div className="relative min-w-[200px]">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                        <input 
                            type="text" 
                            placeholder={locale === 'ko' ? '주문자명, 상품명, 주문번호...' : 'Search customer, product...'}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 pr-3 py-2 bg-stone-50 border-0 rounded-xl text-xs outline-none focus:bg-stone-100 text-stone-600 w-full"
                        />
                    </div>

                    {/* Excel/CSV Download */}
                    <button
                        onClick={handleExportCSV}
                        className="px-4 py-2.5 bg-white border border-stone-100 hover:bg-stone-50 text-stone-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-inner-soft"
                    >
                        <Download size={14} className="text-[#8FBC8F]" />
                        <span>{locale === 'ko' ? '발주서 다운로드 (CSV)' : 'Export CSV'}</span>
                    </button>

                    {/* Excel/CSV Upload */}
                    <input 
                        type="file" 
                        accept=".csv"
                        ref={fileInputRef}
                        onChange={handleImportCSV}
                        className="hidden"
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2.5 bg-[#E8F0E8] text-[#556B2F] hover:bg-[#8FBC8F] hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                    >
                        <Upload size={14} />
                        <span>{locale === 'ko' ? '운송장 일괄 업로드' : 'Import CSV'}</span>
                    </button>
                </div>
            </div>

            {/* Coupang Wing Grid Style Table Container */}
            <div className="bg-white rounded-3xl border border-stone-150 shadow-soft overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left text-xs min-w-[1200px] table-fixed">
                        <colgroup>
                            <col className="w-12" />
                            <col className="w-36" />
                            <col className="w-20" />
                            <col className="w-32" />
                            <col className="w-36" />
                            <col className="w-28" />
                            <col className="w-72" />
                            <col className="w-40" />
                            <col className="w-64" />
                            <col className="w-56" />
                        </colgroup>
                        <thead>
                            <tr className="bg-stone-100 text-stone-600 font-bold border-b border-stone-200">
                                <th className="p-3 text-center border-r border-stone-200">
                                    <input 
                                        type="checkbox" 
                                        checked={isAllSelected}
                                        onChange={handleSelectAll}
                                        className="rounded focus:ring-blue-500 w-3.5 h-3.5"
                                    />
                                </th>
                                <th className="p-3 border-r border-stone-200">{locale === 'ko' ? '주문번호' : 'Order ID'}</th>
                                <th className="p-3 border-r border-stone-200 text-center">{locale === 'ko' ? '분리배송' : 'Split'}</th>
                                <th className="p-3 border-r border-stone-200">{locale === 'ko' ? '택배사' : 'Carrier'}</th>
                                <th className="p-3 border-r border-stone-200">{locale === 'ko' ? '운송장번호' : 'Tracking Number'}</th>
                                <th className="p-3 border-r border-stone-200 text-center">{locale === 'ko' ? '출고예정일' : 'Expected Ship'}</th>
                                <th className="p-3 border-r border-stone-200">{locale === 'ko' ? '등록상품명/옵션/수량' : 'Product Name/Option/Qty'}</th>
                                <th className="p-3 border-r border-stone-200">{locale === 'ko' ? '수취인/연락처' : 'Recipient/Contact'}</th>
                                <th className="p-3 border-r border-stone-200">{locale === 'ko' ? '배송지 주소' : 'Shipping Address'}</th>
                                <th className="p-3">{locale === 'ko' ? '배송 메시지' : 'Shipping Message'}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-200 font-semibold text-stone-700">
                            {filteredOrders.length > 0 ? (
                                filteredOrders.map((o) => {
                                    const isSelected = selectedOrderIds.includes(o.id);
                                    const hasError = !!validationErrors[o.id];
                                    const isEditable = o.status === 'new' || o.status === 'preparing';

                                    return (
                                        <tr 
                                            key={o.id} 
                                            className={`
                                                transition-colors border-b border-stone-200
                                                ${isSelected ? 'bg-blue-50/20' : 'bg-white hover:bg-stone-50/50'}
                                                ${hasError ? 'border-2 border-rose-500 bg-rose-50/10' : ''}
                                            `}
                                        >
                                            {/* Checkbox */}
                                            <td className="p-3 text-center border-r border-stone-200">
                                                <input 
                                                    type="checkbox" 
                                                    checked={isSelected}
                                                    onChange={(e) => handleSelectOrder(o.id, e.target.checked)}
                                                    className="rounded focus:ring-blue-500 w-3.5 h-3.5"
                                                />
                                            </td>

                                            {/* Order Number (Blue link) */}
                                            <td className="p-3 border-r border-stone-200">
                                                <span 
                                                    onClick={() => alert(`[주문 상세 정보]\n\n주문 번호: ${o.id}\n결제 일시: ${o.orderTime}\n주문 상품: ${o.productName}\n금액: ₩${o.price.toLocaleString()}`)}
                                                    className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer font-bold select-all"
                                                >
                                                    {o.id}
                                                </span>
                                                <span className="block text-[9px] text-stone-400 mt-1 font-medium">{o.orderTime}</span>
                                            </td>

                                            {/* Split Delivery */}
                                            <td className="p-3 border-r border-stone-200 text-center text-stone-500">
                                                {o.splitShipping}
                                            </td>

                                            {/* Carrier Selection */}
                                            <td className="p-3 border-r border-stone-200">
                                                {isEditable ? (
                                                    <select
                                                        value={o.carrier || '택배사 선택'}
                                                        onChange={(e) => handleFieldChange(o.id, 'carrier', e.target.value === '택배사 선택' ? '' : e.target.value)}
                                                        className={`w-full bg-white border border-stone-300 rounded-lg p-2 text-xs focus:ring-1 focus:ring-blue-500 outline-none font-bold ${
                                                            !o.carrier ? 'text-stone-400' : 'text-stone-700'
                                                        }`}
                                                    >
                                                        <option value="택배사 선택">{locale === 'ko' ? '택배사 선택' : 'Carrier'}</option>
                                                        {allowedCarriers.map(c => (
                                                            <option key={c} value={c}>{c}</option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    <span className="font-bold">{o.carrier || '-'}</span>
                                                )}
                                            </td>

                                            {/* Tracking Number Input */}
                                            <td className="p-3 border-r border-stone-200">
                                                {isEditable ? (
                                                    <div className="relative flex items-center">
                                                        <input 
                                                            type="text" 
                                                            placeholder={locale === 'ko' ? '운송장번호 등록' : 'Tracking Num'}
                                                            value={o.trackingNumber}
                                                            onChange={(e) => handleFieldChange(o.id, 'trackingNumber', e.target.value)}
                                                            className="w-full bg-white border border-stone-300 rounded-lg pl-2 pr-7 py-2 text-xs outline-none focus:ring-1 focus:ring-blue-500 text-stone-700 font-bold placeholder:text-stone-400"
                                                        />
                                                        <Edit2 size={12} className="absolute right-2 text-stone-400 pointer-events-none" />
                                                    </div>
                                                ) : (
                                                    <span className="font-bold select-all">{o.trackingNumber || '-'}</span>
                                                )}
                                                {hasError && (
                                                    <span className="text-[9px] text-rose-500 font-bold block mt-1 leading-tight">
                                                        {validationErrors[o.id]}
                                                    </span>
                                                )}
                                            </td>

                                            {/* Ship Date */}
                                            <td className="p-3 border-r border-stone-200 text-center font-bold text-stone-600">
                                                {o.expectedShipDate}
                                            </td>

                                            {/* Product details */}
                                            <td className="p-3 border-r border-stone-200 space-y-1">
                                                <div className="text-stone-400 font-semibold leading-tight">
                                                    등록상품명: {o.productName}
                                                </div>
                                                <div className="text-blue-600 font-bold leading-tight hover:underline cursor-pointer">
                                                    노출상품명: {o.productName}
                                                </div>
                                                <div className="text-[10px] text-stone-500 font-medium">
                                                    ({o.optionSelected}) {o.quantity}개
                                                </div>
                                            </td>

                                            {/* Recipient & Contact */}
                                            <td className="p-3 border-r border-stone-200 space-y-1">
                                                <div className="font-bold text-stone-800">{o.customerName}</div>
                                                <div className="text-[10px] text-stone-500 font-semibold select-all">{o.contact}</div>
                                            </td>

                                            {/* Shipping address */}
                                            <td className="p-3 border-r border-stone-200 text-xs text-stone-500 leading-tight">
                                                {o.address}
                                            </td>

                                            {/* Shipping Message */}
                                            <td className="p-3 text-xs text-stone-400 leading-tight italic">
                                                {o.shippingMessage}
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={10} className="p-20 text-center text-stone-400 font-bold">
                                        <AlertTriangle className="w-10 h-10 mx-auto text-stone-200 mb-3" />
                                        {locale === 'ko' ? '주문 내역이 없습니다.' : 'No orders found.'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            
            {/* Legend / Info box */}
            <div className="bg-stone-50 border border-stone-150 p-4 rounded-3xl flex gap-3 text-stone-500">
                <Info size={18} className="text-[#8FBC8F] shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                    <span className="font-bold text-stone-700 block">발송처리 안내 가이드 (Coupang Wing)</span>
                    <p>1. 운송장을 개별 등록 시: 좌측 체크박스를 선택하고 택배사와 송장번호를 채운 뒤 상단 <b>[선택 건 발송 처리]</b>를 누르면 발송 완료됩니다.</p>
                    <p>2. 엑셀(CSV) 일괄 등록 시: <b>[발주서 다운로드]</b>를 진행하여 다운로드한 파일의 K열(택배사)과 L열(운송장번호)을 입력해 다시 <b>[운송장 일괄 업로드]</b> 하시면 일괄 적용됩니다.</p>
                </div>
            </div>
        </div>
    );
}
