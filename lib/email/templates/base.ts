// Базовый HTML шаблон для всех писем
export function baseTemplate(content: string, preheader?: string): string {
  return `
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>CloudHost</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    /* Reset */
    body, table, td, p, a, li, blockquote {
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }
    table, td {
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }
    img {
      -ms-interpolation-mode: bicubic;
      border: 0;
      height: auto;
      line-height: 100%;
      outline: none;
      text-decoration: none;
    }
    
    /* Base */
    body {
      margin: 0 !important;
      padding: 0 !important;
      background-color: #f4f4f5;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    }
    
    /* Container */
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    
    /* Header */
    .header {
      background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
      padding: 40px 20px;
      text-align: center;
    }
    .logo {
      font-size: 28px;
      font-weight: 700;
      color: #ffffff;
      text-decoration: none;
    }
    .logo-icon {
      display: inline-block;
      width: 40px;
      height: 40px;
      background: rgba(255,255,255,0.2);
      border-radius: 8px;
      line-height: 40px;
      margin-right: 10px;
      font-size: 24px;
    }
    
    /* Content */
    .content {
      padding: 40px 30px;
    }
    .content h1 {
      color: #18181b;
      font-size: 24px;
      font-weight: 600;
      margin: 0 0 20px 0;
    }
    .content p {
      color: #52525b;
      font-size: 16px;
      line-height: 1.6;
      margin: 0 0 16px 0;
    }
    
    /* Button */
    .button-container {
      text-align: center;
      margin: 30px 0;
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
      color: #ffffff !important;
      font-size: 16px;
      font-weight: 600;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 8px;
      transition: all 0.2s;
    }
    .button:hover {
      opacity: 0.9;
    }
    .button-secondary {
      background: #f4f4f5;
      color: #18181b !important;
    }
    
    /* Info Box */
    .info-box {
      background-color: #f0f9ff;
      border-left: 4px solid #3b82f6;
      padding: 16px 20px;
      margin: 20px 0;
      border-radius: 0 8px 8px 0;
    }
    .info-box p {
      color: #0369a1;
      margin: 0;
      font-size: 14px;
    }
    
    /* Warning Box */
    .warning-box {
      background-color: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 16px 20px;
      margin: 20px 0;
      border-radius: 0 8px 8px 0;
    }
    .warning-box p {
      color: #92400e;
      margin: 0;
      font-size: 14px;
    }
    
    /* Success Box */
    .success-box {
      background-color: #d1fae5;
      border-left: 4px solid #10b981;
      padding: 16px 20px;
      margin: 20px 0;
      border-radius: 0 8px 8px 0;
    }
    .success-box p {
      color: #065f46;
      margin: 0;
      font-size: 14px;
    }
    
    /* Data Table */
    .data-table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    .data-table td {
      padding: 12px 16px;
      border-bottom: 1px solid #e4e4e7;
    }
    .data-table .label {
      color: #71717a;
      font-size: 14px;
      width: 40%;
    }
    .data-table .value {
      color: #18181b;
      font-size: 14px;
      font-weight: 500;
    }
    
    /* Code Block */
    .code-block {
      background-color: #18181b;
      color: #10b981;
      font-family: 'Monaco', 'Consolas', monospace;
      font-size: 14px;
      padding: 16px 20px;
      border-radius: 8px;
      margin: 20px 0;
      overflow-x: auto;
    }
    
    /* Divider */
    .divider {
      height: 1px;
      background-color: #e4e4e7;
      margin: 30px 0;
    }
    
    /* Footer */
    .footer {
      background-color: #fafafa;
      padding: 30px;
      text-align: center;
      border-top: 1px solid #e4e4e7;
    }
    .footer p {
      color: #71717a;
      font-size: 12px;
      margin: 0 0 8px 0;
    }
    .footer a {
      color: #3b82f6;
      text-decoration: none;
    }
    .social-links {
      margin: 20px 0;
    }
    .social-links a {
      display: inline-block;
      margin: 0 8px;
      color: #71717a;
    }
    
    /* Responsive */
    @media screen and (max-width: 600px) {
      .email-container {
        width: 100% !important;
      }
      .content {
        padding: 30px 20px !important;
      }
      .header {
        padding: 30px 20px !important;
      }
    }
  </style>
</head>
<body>
  ${preheader ? `<div style="display:none;font-size:1px;color:#f4f4f5;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">${preheader}</div>` : ''}
  
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#f4f4f5;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" class="email-container" style="max-width:600px;margin:0 auto;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px -1px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td class="header">
              <a href="{{baseUrl}}" class="logo">
                <span class="logo-icon">☁️</span>CloudHost
              </a>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td class="content">
              ${content}
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td class="footer">
              <div class="social-links">
                <a href="{{discordUrl}}">Discord</a>
                <a href="{{telegramUrl}}">Telegram</a>
                <a href="{{twitterUrl}}">Twitter</a>
              </div>
              <p>© ${new Date().getFullYear()} CloudHost. Все права защищены.</p>
              <p>
                <a href="{{baseUrl}}/privacy">Политика конфиденциальности</a> • 
                <a href="{{baseUrl}}/terms">Условия использования</a>
              </p>
              <p style="margin-top:16px;">
                <a href="{{unsubscribeUrl}}" style="color:#a1a1aa;">Отписаться от рассылки</a>
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`
}
