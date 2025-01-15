import nodeMailer from 'nodemailer';

const makeTransport = (env) => {
    return nodeMailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: false,
        service: 'Gmail',
        auth: {
            user: env.SMTP_EMAIL,
            pass: env.APP_PASSWORD,
        }
    });
}

export {makeTransport};