
import { AuthForm } from '@/components/auth/AuthForm';
import { login } from '@/app/actions/auth';

export default async function LoginPage({
    searchParams,
}: {
    searchParams: Promise<{ message?: string; error?: string }>;
}) {
    const { message, error } = await searchParams;

    return (
        <div className="min-h-[80vh] flex items-center justify-center bg-[#FDFBF7]">
            <AuthForm
                type="login"
                action={login}
                message={message}
                error={error}
            />
        </div>
    );
}
