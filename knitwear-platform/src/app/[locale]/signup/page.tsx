
import { AuthForm } from '@/components/auth/AuthForm';
import { signup } from '@/app/actions/auth';

export default async function SignupPage({
    searchParams,
}: {
    searchParams: Promise<{ message?: string; error?: string }>;
}) {
    const { message, error } = await searchParams;

    return (
        <div className="min-h-[80vh] flex items-center justify-center bg-[#FDFBF7]">
            <AuthForm
                type="signup"
                action={signup}
                message={message}
                error={error}
            />
        </div>
    );
}
