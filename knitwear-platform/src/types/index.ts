// User & Auth Types
export interface Profile {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
    bio: string | null;
    is_seller: boolean;
    stripe_customer_id: string | null;
    stripe_account_id: string | null;
    preferred_language: 'en' | 'ko';
    created_at: string;
    updated_at: string;
}

// Pattern Types
export type YarnWeight = 'lace' | 'fingering' | 'sport' | 'dk' | 'worsted' | 'aran' | 'bulky' | 'super_bulky';
export type Technique = 'stockinette' | 'cable' | 'colorwork' | 'lace' | 'brioche' | 'mosaic';
export type Difficulty = 'beginner' | 'intermediate' | 'advanced';
export type PatternStatus = 'draft' | 'published' | 'archived';
export type Category = 'sweater' | 'hat' | 'scarf' | 'socks' | 'gloves' | 'blanket' | 'toy' | 'other';

export interface LocalizedText {
    en: string;
    ko: string;
}

export interface Pattern {
    id: string;
    creator_id: string;
    title: LocalizedText;
    description: LocalizedText | null;
    thumbnail_url: string | null;
    category: Category | null;
    subcategory?: string; // Added for grid editor patterns
    difficulty: Difficulty | null;
    yarn_weight: YarnWeight[];
    needle_size_mm: number[];
    needles?: string; // String format from grid editor (e.g., "4.0mm")
    techniques: Technique[];
    gauge_stitches: number | null;
    gauge_rows: number | null;
    gauge?: string; // String format from grid editor (e.g., "22코 30단 (10cm)")
    is_free: boolean;
    price_usd: number | null;
    price_krw: number | null;
    pdf_url: string | null;
    preview_images: string[];
    download_count: number;
    like_count?: number;
    review_count?: number;
    average_rating?: number;
    view_count: number;
    status: PatternStatus;
    is_ai_generated: boolean;
    source?: 'original' | 'ravelry';
    designer_id: string;
    created_at: string;
    updated_at: string;
    // New fields from user request (localized)
    sizes?: { ko: string; en: string };
    measurements?: { ko: string; en: string };
    // Grid editor data for PDF generation
    grid_data?: number[][] | any[][];
    palette?: string[];
    grid_width?: number;
    grid_height?: number;
    content?: any; // JSONB content for PDF metadata etc.
}

// Order Types
export type OrderStatus = 'pending' | 'completed' | 'refunded';

export interface Order {
    id: string;
    buyer_id: string;
    pattern_id: string;
    stripe_payment_intent_id: string | null;
    amount_paid: number;
    currency: string;
    status: OrderStatus;
    download_count: number;
    max_downloads: number;
    watermarked_pdf_url: string | null;
    ad_watched: boolean;
    ad_watched_at: string | null;
    created_at: string;
    // Joined fields
    pattern?: Pattern;
}

// AI Types
export type AIRequestType = 'image_to_chart' | 'chat_to_pattern';
export type AIStatus = 'success' | 'failed' | 'timeout';

export interface AILog {
    id: string;
    user_id: string;
    request_type: AIRequestType;
    input_data: Record<string, unknown>;
    output_data: Record<string, unknown> | null;
    tokens_used: number | null;
    processing_time_ms: number | null;
    status: AIStatus;
    error_message: string | null;
    created_at: string;
}

// Pattern Editor Types
export interface GridCell {
    color: string;
    symbol: string;
}

export interface PatternDraft {
    id: string;
    user_id: string;
    name: string;
    grid_data: GridCell[][];
    settings: EditorSettings;
    created_at: string;
    updated_at: string;
}

export interface EditorSettings {
    width: number;
    height: number;
    cellSize: number;
    palette: string[];
    showGridLines: boolean;
    showSymbols: boolean;
}

// Image to Chart Types
export interface ChartConversionRequest {
    targetWidth: number;
    targetHeight: number;
    maxColors: number;
}

export interface ChartConversionResult {
    grid: number[][];
    palette: string[];
    width: number;
    height: number;
}

// Filter Types for Marketplace
export interface PatternFilters {
    search?: string;
    category?: Category;
    yarnWeight?: YarnWeight[];
    techniques?: Technique[];
    difficulty?: Difficulty;
    needleSizeMin?: number;
    needleSizeMax?: number;
    priceMin?: number;
    priceMax?: number;
    freeOnly?: boolean;
    sortBy?: 'newest' | 'popular' | 'price_asc' | 'price_desc';
}
