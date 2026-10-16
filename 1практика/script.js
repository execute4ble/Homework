
    const existingLogins = ['admin123', 'user2024', 'testuser'];

    const form = document.getElementById('registerForm');
    const loginInput = document.getElementById('login');
    const passwordInput = document.getElementById('password');
    const passwordConfirmInput = document.getElementById('passwordConfirm');
    const fullnameInput = document.getElementById('fullname');
    const phoneInput = document.getElementById('phone');
    const emailInput = document.getElementById('email');
    const successMessage = document.getElementById('successMessage');
    const submitBtn = document.getElementById('submitBtn');

    function checkLoginUnique() {
        const value = loginInput.value.trim().toLowerCase();
        const isDuplicate = existingLogins.includes(value);

        if (isDuplicate) {
            loginInput.setCustomValidity('duplicate');
        } else {
            loginInput.setCustomValidity('');
        }
        return !isDuplicate;
    }

    function checkPasswordsMatch() {
        if (passwordConfirmInput.value !== passwordInput.value) {
            passwordConfirmInput.setCustomValidity('mismatch');
        } else {
            passwordConfirmInput.setCustomValidity('');
        }
    }

    phoneInput.addEventListener('input', (e) => {
        let digits = e.target.value.replace(/\D/g, '');
        if (digits.startsWith('8')) digits = digits.substring(1);
        digits = digits.substring(0, 10);

        let result = '';
        if (digits.length > 0) {
            result = '8(' + digits.substring(0, 3);
            if (digits.length >= 3) result += ')';
            if (digits.length > 3) result += digits.substring(3, 6);
            if (digits.length > 6) result += '-' + digits.substring(6, 8);
            if (digits.length > 8) result += '-' + digits.substring(8, 10);
        }
        e.target.value = result;
    });

    document.getElementById('togglePassword').addEventListener('click', () => {
        const type = passwordInput.type === 'password' ? 'text' : 'password';
        passwordInput.type = type;
    });

    loginInput.addEventListener('input', () => {
        checkLoginUnique();
        loginInput.classList.toggle('is-invalid',
            loginInput.validity.valid === false && loginInput.value !== '');
    });

    passwordInput.addEventListener('input', () => {
        checkPasswordsMatch();
    });

    passwordConfirmInput.addEventListener('input', checkPasswordsMatch);

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        e.stopPropagation();

        const uniqueOk = checkLoginUnique();
        checkPasswordsMatch();

        if (!form.checkValidity()) {
            form.classList.add('was-validated');

            const firstInvalid = form.querySelector(':invalid');
            if (firstInvalid) firstInvalid.focus();
            return;
        }

        submitBtn.disabled = true;
        submitBtn.innerHTML = `
            <span class="spinner-border spinner-border-sm me-2" role="status"></span>
            Отправка...`;

        try {
            const payload = {
                login: loginInput.value.trim(),
                password: passwordInput.value,
                fullname: fullnameInput.value.trim(),
                phone: phoneInput.value,
                email: emailInput.value.trim()
            };

            const result = await fakeServerRequest(payload);

            if (result.success) {
                successMessage.classList.remove('d-none');
                form.reset();
                form.classList.remove('was-validated');
                setTimeout(() => successMessage.classList.add('d-none'), 5000);
            } else {
                alert('Ошибка: ' + result.message);
            }
        } catch (err) {
            alert('Ошибка сети: ' + err.message);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Создать пользователя';
        }
    });

    function fakeServerRequest(data) {
        return new Promise((resolve) => {
            setTimeout(() => {
                console.log('📤 Отправлено на сервер:', data);
                resolve({ success: true });
            }, 1200);
        });
    }