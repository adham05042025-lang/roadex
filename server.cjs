// server.cjs
const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
require('dotenv').config(); // لقراءة بيانات .env

const app = express();
app.use(cors());
app.use(express.json());

// =================== إعداد الإيميل ===================
// سيتم استخدام بيانات SMTP من ملف .env
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10),
    secure: process.env.SMTP_SECURE === 'true', // تحويل النص إلى boolean
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

// =================== API الإشعارات ===================
app.post('/api/send-email', (req, res) => {
    const { to, subject, message, details } = req.body;

    // بناء الإيميل
    const mailOptions = {
        from: `"Roadex Egypt" <${process.env.SMTP_USER}>`,
        to: to,
        subject: subject,
        html: `
            <div style="font-family: Arial, sans-serif; direction: rtl;">
                <h2>📧 ${subject}</h2>
                <p>${message}</p>
                ${details ? `<pre style="background: #f4f4f4; padding: 10px;">${JSON.stringify(details, null, 2)}</pre>` : ''}
                <hr />
                <p style="color: #888;">تم الإرسال من نظام روادكس لإدارة الحجوزات</p>
            </div>
        `,
    };

    // إرسال الإيميل
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('❌ خطأ في الإرسال:', error);
            res.status(500).json({ success: false, error: error.message });
        } else {
            console.log('✅ تم الإرسال:', info.response);
            res.json({ success: true, messageId: info.messageId });
        }
    });
});

// =================== تشغيل السيرفر ===================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 سيرفر الإيميلات شغال على http://localhost:${PORT}`);
});