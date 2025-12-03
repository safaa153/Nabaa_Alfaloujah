// accountent/js/login/login.js
// FIX: Path to auth.js must be correct relative to this file location
// Assuming structure:
// root/
//   Settings/auth.js
//   accountent/
//     js/
//       login/
//         login.js
import { AuthService } from '../../../Settings/auth.js';

const loginForm = document.getElementById('login-form');
const emailInput = document.getElementById('email');
const passInput = document.getElementById('password');
const btnLogin = document.getElementById('btn-login');

// Force clear old sessions if they land here manually to prevent loops
localStorage.removeItem('sb-access-token');
localStorage.removeItem('sb-refresh-token');

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = emailInput.value.trim();
    const password = passInput.value.trim();

    if (!email || !password) {
        Swal.fire({
            icon: 'warning',
            title: 'تنبيه',
            text: 'يرجى إدخال البريد الإلكتروني وكلمة المرور',
            confirmButtonText: 'حسناً'
        });
        return;
    }

    // Loading State
    const originalBtnContent = btnLogin.innerHTML;
    btnLogin.innerHTML = '<i class="ph ph-spinner animate-spin text-xl"></i> جاري التحقق...';
    btnLogin.disabled = true;
    btnLogin.classList.add('opacity-70', 'cursor-not-allowed');

    try {
        const { data, error } = await AuthService.login(email, password);
        
        if (error) throw error;

        Swal.fire({
            icon: 'success',
            title: 'تم تسجيل الدخول بنجاح',
            text: 'جاري توجيهك...',
            timer: 1000,
            showConfirmButton: false,
            customClass: { popup: 'rounded-2xl' }
        }).then(() => {
            // SUCCESS: Redirect to Overview
            window.location.href = 'overview.html';
        });

    } catch (error) {
        console.error("Login Error:", error);
        
        let msg = 'فشل الدخول. يرجى التحقق من البيانات.';
        if (error.message.includes('Invalid login credentials')) {
            msg = 'البريد الإلكتروني أو كلمة المرور غير صحيحة.';
        }

        Swal.fire({
            icon: 'error',
            title: 'فشل الدخول',
            text: msg,
            confirmButtonText: 'حاول مرة أخرى',
            customClass: { popup: 'rounded-2xl' }
        });
        
        // Reset Button
        btnLogin.innerHTML = originalBtnContent;
        btnLogin.disabled = false;
        btnLogin.classList.remove('opacity-70', 'cursor-not-allowed');
    }
});