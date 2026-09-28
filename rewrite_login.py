import re

with open('src/features/auth/Login.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace imports
content = content.replace(
    'import ReCAPTCHA from "react-google-recaptcha";',
    'import { GoogleReCaptchaProvider, useGoogleReCaptcha } from "react-google-recaptcha-v3";'
)

# Rename export function Login to function LoginForm
content = content.replace('export function Login() {', 'function LoginForm() {')

# Add useGoogleReCaptcha
content = content.replace(
    "const [isResetModalOpen, setIsResetModalOpen] = useState(false);\n  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);\n\n  const recaptchaKey = \"6Ldeb8wtAAAAAHabAuB8njWHe9gSljJg3OhKPZMl\";",
    "const [isResetModalOpen, setIsResetModalOpen] = useState(false);\n  const { executeRecaptcha } = useGoogleReCaptcha();"
)

# Modify handleAuth
handle_auth_orig = """  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');"""

handle_auth_new = """  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!executeRecaptcha) {
      toast.error('reCAPTCHA no está listo todavía');
      return;
    }
    
    try {
      const token = await executeRecaptcha('auth_action');
      if (!token) throw new Error('reCAPTCHA failed');
    } catch (err) {
      toast.error('Error validando reCAPTCHA');
      return;
    }
"""
content = content.replace(handle_auth_orig, handle_auth_new)

# Remove ReCAPTCHA visual block
recaptcha_block = """            <div className="flex justify-center pt-2">
              <ReCAPTCHA
                sitekey={recaptchaKey}
                onChange={(token) => setRecaptchaToken(token)}
              />
            </div>"""
content = content.replace(recaptcha_block, "")

# Remove disabled condition for recaptcha
content = content.replace(
    "disabled={!recaptchaToken || (isRegister && (name.trim().length === 0 || email !== confirmEmail || password !== confirmPassword || !isValidEmail(email) || password.length < 6))}",
    "disabled={isRegister && (name.trim().length === 0 || email !== confirmEmail || password !== confirmPassword || !isValidEmail(email) || password.length < 6)}"
)

# Add export function Login at the end
export_block = """
export function Login() {
  return (
    <GoogleReCaptchaProvider reCaptchaKey="6Ldeb8wtAAAAAHabAuB8njWHe9gSljJg3OhKPZMl">
      <LoginForm />
    </GoogleReCaptchaProvider>
  );
}
"""
content += export_block

with open('src/features/auth/Login.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Done")
