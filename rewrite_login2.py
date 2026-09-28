import re

with open('src/features/auth/Login.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

handle_submit_orig = """  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');"""

handle_submit_new = """  const handleSubmit = async (e: React.FormEvent) => {
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

content = content.replace(handle_submit_orig, handle_submit_new)

with open('src/features/auth/Login.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed handleSubmit")
