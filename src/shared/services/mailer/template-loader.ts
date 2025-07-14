/**
 * Email template loader and processor
 * Handles loading HTML templates and replacing variables
 */

export interface TemplateVariables {
  [key: string]: string;
}

/**
 * Password reset email template as a string constant
 * This avoids file system operations at runtime
 */
export const PASSWORD_RESET_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <title>Reset Your Password</title>
    <style>
        /* Reset styles */
        body, table, td {
            margin: 0;
            padding: 0;
            border: 0;
            font-size: 100%;
            line-height: 1;
        }
        
        table {
            border-collapse: collapse;
            table-layout: fixed;
            mso-table-lspace: 0pt;
            mso-table-rspace: 0pt;
        }
        
        table td {
            border-collapse: collapse;
        }
        
        body {
            margin: 0;
            padding: 0;
            background-color: #F0F0F0;
            font-family: Arial, sans-serif;
            -webkit-text-size-adjust: 100%;
            -ms-text-size-adjust: 100%;
        }
        
        img {
            border: 0;
            height: auto;
            line-height: 100%;
            outline: none;
            text-decoration: none;
            -ms-interpolation-mode: bicubic;
        }
        
        /* Email styles */
        .email-wrapper {
            width: 100%;
            background-color: #F0F0F0;
        }
        
        .email-container {
            width: 600px;
            background-color: #FFFFFF;
        }
        
        .spacer {
            font-size: 1px;
            line-height: 1px;
            height: 40px;
        }
        
        .spacer-small {
            font-size: 1px;
            line-height: 1px;
            height: 30px;
        }
        
        .spacer-large {
            font-size: 1px;
            line-height: 1px;
            height: 60px;
        }
        
        .header-text {
            font-family: Arial, sans-serif;
            font-size: 48px;
            font-weight: bold;
            color: #000000;
            text-align: center;
            line-height: 52px;
            margin: 0;
        }
        
        .content-text {
            font-family: Arial, sans-serif;
            font-size: 20px;
            font-weight: 500;
            color: #666666;
            text-align: center;
            line-height: 30px;
            margin: 0;
        }
        
        .disclaimer-text {
            font-family: Arial, sans-serif;
            font-size: 16px;
            color: #BBBBBB;
            text-align: center;
            line-height: 25px;
            margin: 0;
        }
        
        .footer-text {
            font-family: Arial, sans-serif;
            font-size: 12px;
            color: #BBBBBB;
            text-align: center;
            line-height: 19px;
            margin: 0;
        }
        
        .reset-button {
            display: inline-block;
            background-color: #0055FF;
            color: #FFFFFF !important;
            text-decoration: none;
            padding: 18px 40px;
            border-radius: 14px;
            font-family: Arial, sans-serif;
            font-size: 21px;
            font-weight: 600;
            text-align: center;
            line-height: 58px;
        }
        
        .reset-button:hover {
            background-color: #0044CC;
        }
        
        /* Responsive design */
        @media (max-width: 480px) {
            .email-container {
                width: 100% !important;
            }
            
            .header-text {
                font-size: 36px !important;
            }
            
            .content-text {
                font-size: 18px !important;
            }
            
            .reset-button {
                padding: 16px 30px !important;
                font-size: 18px !important;
            }
        }
    </style>
</head>
<body>
    <table role="presentation" class="email-wrapper" cellpadding="0" cellspacing="0" border="0">
        <tr>
            <td align="center" valign="top" style="background-color: #F0F0F0;">
                <!-- Main Email Container -->
                <table role="presentation" class="email-container" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                        <td style="background-color: #FFFFFF; padding: 40px 20px;">
                            
                            <!-- Spacer -->
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td class="spacer">&nbsp;</td>
                                </tr>
                            </table>
                            
                            <!-- Logo Section -->
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td align="center">
                                        <img src="{{logoUrl}}" alt="Company Logo" width="40" style="display: block;" />
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Spacer -->
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td class="spacer-large">&nbsp;</td>
                                </tr>
                            </table>
                            
                            <!-- Header -->
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td align="center">
                                        <h1 class="header-text">Forgot your password?</h1>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Spacer -->
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td class="spacer-small">&nbsp;</td>
                                </tr>
                            </table>
                            
                            <!-- Content -->
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td align="center">
                                        <table role="presentation" width="350" cellpadding="0" cellspacing="0" border="0">
                                            <tr>
                                                <td>
                                                    <p class="content-text">Hi {{username}}, to reset your password, click the button below. The link will self-destruct after five days.</p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Spacer -->
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td class="spacer">&nbsp;</td>
                                </tr>
                            </table>
                            
                            <!-- Button -->
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td align="center">
                                        <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                                            <tr>
                                                <td style="background-color: #0055FF; border-radius: 14px;">
                                                    <a href="{{resetUrl}}" class="reset-button" target="_blank">Reset your password</a>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Spacer -->
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td class="spacer-large">&nbsp;</td>
                                </tr>
                            </table>
                            
                            <!-- Disclaimer -->
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td align="center">
                                        <table role="presentation" width="350" cellpadding="0" cellspacing="0" border="0">
                                            <tr>
                                                <td>
                                                    <p class="disclaimer-text">If you do not want to change your password or didn't request a reset, you can ignore and delete this email.</p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Spacer -->
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td class="spacer-large">&nbsp;</td>
                                </tr>
                            </table>
                            
                        </td>
                    </tr>
                </table>
                
                <!-- Footer -->
                <table role="presentation" class="email-container" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                        <td style="background-color: transparent; padding: 40px 20px;">
                            
                            <!-- Footer Content -->
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td align="center">
                                        <table role="presentation" width="350" cellpadding="0" cellspacing="0" border="0">
                                            <tr>
                                                <td>
                                                    <p class="footer-text">Best regards,<br>The Sloctavi Team</p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Spacer -->
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td style="font-size: 1px; line-height: 1px; height: 20px;">&nbsp;</td>
                                </tr>
                            </table>
                            
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td align="center">
                                        <table role="presentation" width="350" cellpadding="0" cellspacing="0" border="0">
                                            <tr>
                                                <td>
                                                    <p class="footer-text">&copy; 2025 Sloctavi. All rights reserved.</p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Spacer -->
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td style="font-size: 1px; line-height: 1px; height: 20px;">&nbsp;</td>
                                </tr>
                            </table>
                            
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td align="center">
                                        <table role="presentation" width="350" cellpadding="0" cellspacing="0" border="0">
                                            <tr>
                                                <td>
                                                    <p class="footer-text">
                                                        <a href="https://sloctavi.com" style="color: #BBBBBB; text-decoration: none;">Visit our website</a> | 
                                                        <a href="https://sloctavi.com/support" style="color: #BBBBBB; text-decoration: none;">Support</a>
                                                    </p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                            
                        </td>
                    </tr>
                </table>
                
            </td>
        </tr>
    </table>
</body>
</html>`;

/**
 * OTP Verification email template as a string constant
 */
export const OTP_VERIFICATION_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <title>Email Verification</title>
    <style>
        /* Reset styles */
        body, table, td {
            margin: 0;
            padding: 0;
            border: 0;
            font-size: 100%;
            line-height: 1;
        }
        
        table {
            border-collapse: collapse;
            table-layout: fixed;
            mso-table-lspace: 0pt;
            mso-table-rspace: 0pt;
        }
        
        table td {
            border-collapse: collapse;
        }
        
        body {
            margin: 0;
            padding: 0;
            background-color: #F0F0F0;
            font-family: Arial, sans-serif;
            -webkit-text-size-adjust: 100%;
            -ms-text-size-adjust: 100%;
        }
        
        img {
            border: 0;
            height: auto;
            line-height: 100%;
            outline: none;
            text-decoration: none;
            -ms-interpolation-mode: bicubic;
        }
        
        .email-wrapper {
            width: 100%;
            background-color: #F0F0F0;
        }
        
        .email-container {
            width: 600px;
            background-color: #FFFFFF;
        }
        
        .spacer {
            font-size: 1px;
            line-height: 1px;
            height: 40px;
        }
        
        .spacer-small {
            font-size: 1px;
            line-height: 1px;
            height: 30px;
        }
        
        .header-text {
            font-family: Arial, sans-serif;
            font-size: 42px;
            font-weight: bold;
            color: #000000;
            text-align: center;
            line-height: 48px;
            margin: 0;
        }
        
        .content-text {
            font-family: Arial, sans-serif;
            font-size: 18px;
            color: #333333;
            text-align: center;
            line-height: 26px;
            margin: 0;
        }
        
        .otp-code {
            font-family: Arial, sans-serif;
            font-size: 36px;
            font-weight: bold;
            color: #667eea;
            text-align: center;
            margin: 20px 0;
            padding: 20px;
            background-color: #f8f9ff;
            border-radius: 8px;
            letter-spacing: 4px;
        }
        
        .footer-text {
            font-family: Arial, sans-serif;
            font-size: 12px;
            color: #BBBBBB;
            text-align: center;
            line-height: 19px;
            margin: 0;
        }
        
        /* Responsive design */
        @media (max-width: 480px) {
            .email-container {
                width: 100% !important;
            }
            
            .header-text {
                font-size: 32px !important;
            }
            
            .content-text {
                font-size: 16px !important;
            }
            
            .otp-code {
                font-size: 28px !important;
            }
        }
    </style>
</head>
<body>
    <table role="presentation" class="email-wrapper" cellpadding="0" cellspacing="0" border="0">
        <tr>
            <td align="center" valign="top" style="background-color: #F0F0F0;">
                <table role="presentation" class="email-container" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                        <td style="background-color: #FFFFFF; padding: 40px 20px;">
                            
                            <!-- Logo Section -->
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td align="center">
                                        <img src="{{logoUrl}}" alt="Company Logo" width="40" style="display: block;" />
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Spacer -->
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td class="spacer">&nbsp;</td>
                                </tr>
                            </table>
                            
                            <!-- Header -->
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td align="center">
                                        <h1 class="header-text">🔐 Email Verification</h1>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Spacer -->
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td class="spacer-small">&nbsp;</td>
                                </tr>
                            </table>
                            
                            <!-- Content -->
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td align="center">
                                        <table role="presentation" width="400" cellpadding="0" cellspacing="0" border="0">
                                            <tr>
                                                <td>
                                                    <p class="content-text">Hi {{username}},</p>
                                                    <p class="content-text">Your verification code is:</p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- OTP Code -->
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td align="center">
                                        <table role="presentation" width="300" cellpadding="0" cellspacing="0" border="0">
                                            <tr>
                                                <td>
                                                    <div class="otp-code">{{otpCode}}</div>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- More Content -->
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td align="center">
                                        <table role="presentation" width="400" cellpadding="0" cellspacing="0" border="0">
                                            <tr>
                                                <td>
                                                    <p class="content-text">Please use this code to complete your registration.</p>
                                                    <p class="content-text">This code will expire in 10 minutes for security purposes.</p>
                                                    <p class="content-text">Thank you for joining Sloctavi!</p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                            
                        </td>
                    </tr>
                </table>
                
                <!-- Footer -->
                <table role="presentation" class="email-container" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                        <td style="background-color: transparent; padding: 40px 20px;">
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td align="center">
                                        <table role="presentation" width="350" cellpadding="0" cellspacing="0" border="0">
                                            <tr>
                                                <td>
                                                    <p class="footer-text">Best regards,<br>The Sloctavi Team</p>
                                                    <p class="footer-text">&copy; 2025 Sloctavi. All rights reserved.</p>
                                                    <p class="footer-text">
                                                        <a href="https://sloctavi.com" style="color: #BBBBBB; text-decoration: none;">Visit our website</a> | 
                                                        <a href="https://sloctavi.com/support" style="color: #BBBBBB; text-decoration: none;">Support</a>
                                                    </p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
                
            </td>
        </tr>
    </table>
</body>
</html>`;

/**
 * Welcome email template as a string constant
 */
export const WELCOME_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <title>Welcome to Sloctavi</title>
    <style>
        /* Reset styles */
        body, table, td {
            margin: 0;
            padding: 0;
            border: 0;
            font-size: 100%;
            line-height: 1;
        }
        
        table {
            border-collapse: collapse;
            table-layout: fixed;
            mso-table-lspace: 0pt;
            mso-table-rspace: 0pt;
        }
        
        table td {
            border-collapse: collapse;
        }
        
        body {
            margin: 0;
            padding: 0;
            background-color: #F0F0F0;
            font-family: Arial, sans-serif;
            -webkit-text-size-adjust: 100%;
            -ms-text-size-adjust: 100%;
        }
        
        img {
            border: 0;
            height: auto;
            line-height: 100%;
            outline: none;
            text-decoration: none;
            -ms-interpolation-mode: bicubic;
        }
        
        .email-wrapper {
            width: 100%;
            background-color: #F0F0F0;
        }
        
        .email-container {
            width: 600px;
            background-color: #FFFFFF;
        }
        
        .spacer {
            font-size: 1px;
            line-height: 1px;
            height: 40px;
        }
        
        .spacer-small {
            font-size: 1px;
            line-height: 1px;
            height: 30px;
        }
        
        .header-text {
            font-family: Arial, sans-serif;
            font-size: 42px;
            font-weight: bold;
            color: #000000;
            text-align: center;
            line-height: 48px;
            margin: 0;
        }
        
        .content-text {
            font-family: Arial, sans-serif;
            font-size: 18px;
            color: #333333;
            text-align: center;
            line-height: 26px;
            margin: 0;
        }
        
        .cta-button {
            display: inline-block;
            background-color: #667eea;
            color: #FFFFFF !important;
            text-decoration: none;
            padding: 18px 40px;
            border-radius: 14px;
            font-family: Arial, sans-serif;
            font-size: 18px;
            font-weight: 600;
            text-align: center;
            line-height: 1;
        }
        
        .cta-button:hover {
            background-color: #5a6fd8;
        }
        
        .footer-text {
            font-family: Arial, sans-serif;
            font-size: 12px;
            color: #BBBBBB;
            text-align: center;
            line-height: 19px;
            margin: 0;
        }
        
        /* Responsive design */
        @media (max-width: 480px) {
            .email-container {
                width: 100% !important;
            }
            
            .header-text {
                font-size: 32px !important;
            }
            
            .content-text {
                font-size: 16px !important;
            }
            
            .cta-button {
                padding: 16px 30px !important;
                font-size: 16px !important;
            }
        }
    </style>
</head>
<body>
    <table role="presentation" class="email-wrapper" cellpadding="0" cellspacing="0" border="0">
        <tr>
            <td align="center" valign="top" style="background-color: #F0F0F0;">
                <table role="presentation" class="email-container" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                        <td style="background-color: #FFFFFF; padding: 40px 20px;">
                            
                            <!-- Logo Section -->
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td align="center">
                                        <img src="{{logoUrl}}" alt="Company Logo" width="40" style="display: block;" />
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Spacer -->
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td class="spacer">&nbsp;</td>
                                </tr>
                            </table>
                            
                            <!-- Header -->
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td align="center">
                                        <h1 class="header-text">🎉 Welcome to Sloctavi!</h1>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Spacer -->
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td class="spacer-small">&nbsp;</td>
                                </tr>
                            </table>
                            
                            <!-- Content -->
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td align="center">
                                        <table role="presentation" width="400" cellpadding="0" cellspacing="0" border="0">
                                            <tr>
                                                <td>
                                                    <p class="content-text">Hi {{username}},</p>
                                                    <p class="content-text">Welcome to Sloctavi! We're excited to have you on board.</p>
                                                    <p class="content-text">Our platform connects you with skilled professionals for all your service needs. Whether you're looking to book a service or provide one, we're here to make the process smooth and reliable.</p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Spacer -->
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td class="spacer">&nbsp;</td>
                                </tr>
                            </table>
                            
                            <!-- Button -->
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td align="center">
                                        <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                                            <tr>
                                                <td style="background-color: #667eea; border-radius: 14px;">
                                                    <a href="{{dashboardUrl}}" class="cta-button" target="_blank">Explore Your Dashboard</a>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Spacer -->
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td class="spacer">&nbsp;</td>
                                </tr>
                            </table>
                            
                            <!-- More Content -->
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td align="center">
                                        <table role="presentation" width="400" cellpadding="0" cellspacing="0" border="0">
                                            <tr>
                                                <td>
                                                    <p class="content-text">Feel free to explore our features and let us know if you have any questions. Our support team is always ready to help!</p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                            
                        </td>
                    </tr>
                </table>
                
                <!-- Footer -->
                <table role="presentation" class="email-container" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                        <td style="background-color: transparent; padding: 40px 20px;">
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td align="center">
                                        <table role="presentation" width="350" cellpadding="0" cellspacing="0" border="0">
                                            <tr>
                                                <td>
                                                    <p class="footer-text">Best regards,<br>The Sloctavi Team</p>
                                                    <p class="footer-text">&copy; 2025 Sloctavi. All rights reserved.</p>
                                                    <p class="footer-text">
                                                        <a href="https://sloctavi.com" style="color: #BBBBBB; text-decoration: none;">Visit our website</a> | 
                                                        <a href="https://sloctavi.com/support" style="color: #BBBBBB; text-decoration: none;">Support</a>
                                                    </p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
                
            </td>
        </tr>
    </table>
</body>
</html>`;

/**
 * Replace template variables in HTML content
 * @param template - HTML template string
 * @param variables - Object containing variable replacements
 * @returns Processed HTML string
 */
export function processTemplate(template: string, variables: TemplateVariables): string {
  let processedTemplate = template;
  
  // Replace all template variables in the format {{variableName}}
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    processedTemplate = processedTemplate.replace(regex, value);
  });
  
  return processedTemplate;
}

/**
 * Generate password reset email HTML
 * @param username - User's name
 * @param resetUrl - Password reset URL
 * @param logoUrl - Company logo URL (optional)
 * @returns Processed HTML email content
 */
export function renderPasswordResetTemplate(
  username: string, 
  resetUrl: string, 
  logoUrl: string = 'https://sloctavi.com/logo.png'
): string {
  return processTemplate(PASSWORD_RESET_TEMPLATE, {
    username,
    resetUrl,
    logoUrl
  });
}

/**
 * Generate OTP verification email HTML
 * @param username - User's name
 * @param otpCode - The OTP code
 * @param logoUrl - Company logo URL (optional)
 * @returns Processed HTML email content
 */
export function renderOtpVerificationTemplate(
  username: string, 
  otpCode: string, 
  logoUrl: string = 'https://sloctavi.com/logo.png'
): string {
  return processTemplate(OTP_VERIFICATION_TEMPLATE, {
    username,
    otpCode,
    logoUrl
  });
}

/**
 * Generate welcome email HTML
 * @param username - User's name
 * @param dashboardUrl - Dashboard URL (optional)
 * @param logoUrl - Company logo URL (optional)
 * @returns Processed HTML email content
 */
export function renderWelcomeTemplate(
  username: string, 
  dashboardUrl: string = 'https://sloctavi.com/dashboard',
  logoUrl: string = 'https://sloctavi.com/logo.png'
): string {
  return processTemplate(WELCOME_TEMPLATE, {
    username,
    dashboardUrl,
    logoUrl
  });
}
