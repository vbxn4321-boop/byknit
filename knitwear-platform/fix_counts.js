const fs = require('fs');
const path = 'C:\\Users\\CHA\\Desktop\\knitwear-platform\\knitwear-platform\\src\\components\\community\\CommunityClient.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add like_count and comment_count to interface
if (!content.includes('like_count?: number;')) {
    content = content.replace(
        /likes: \{ count: number \}\[\];\s+comments: \{ count: number \}\[\];/,
        "likes: { count: number }[];\n    comments: { count: number }[];\n    like_count?: number;\n    comment_count?: number;"
    );
}

// 2. Add helper functions
if (!content.includes('const getLikeCount')) {
    content = content.replace(
        /export function CommunityClient\(\{ initialPosts, popularPosts, user, locale \}: CommunityClientProps\) \{/,
        `const getLikeCount = (post: any) => {
    if (post.likes && Array.isArray(post.likes) && post.likes.length > 0) return post.likes[0].count || 0;
    if (typeof post.like_count === 'number') return post.like_count;
    return 0;
};

const getCommentCount = (post: any) => {
    if (post.comments && Array.isArray(post.comments) && post.comments.length > 0) return post.comments[0].count || 0;
    if (typeof post.comment_count === 'number') return post.comment_count;
    return 0;
};

export function CommunityClient({ initialPosts, popularPosts, user, locale }: CommunityClientProps) {`
    );
}

// 3. Replace all instances
content = content.replace(/post\.likes\?\.\[0\]\?\.count \|\| 0/g, 'getLikeCount(post)');
content = content.replace(/post\.comments\?\.\[0\]\?\.count \|\| 0/g, 'getCommentCount(post)');
content = content.replace(/p\.likes\?\.\[0\]\?\.count \|\| 0/g, 'getLikeCount(p)');
content = content.replace(/\[\{post\.comments\[0\]\.count\}\]/g, '[{getCommentCount(post)}]');

fs.writeFileSync(path, content, 'utf8');
console.log('Fixed CommunityClient.tsx');
