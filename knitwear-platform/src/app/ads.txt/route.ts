export const dynamic = 'force-static';

export function GET() {
    return new Response('google.com, pub-4367705210889906, DIRECT, f08c47fec0942fa0\n', {
        headers: {
            'Content-Type': 'text/plain; charset=utf-8',
        },
    });
}
